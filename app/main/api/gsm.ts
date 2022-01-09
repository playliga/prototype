import os from 'os';
import path from 'path';
import fs from 'fs';
import is from 'electron-is';
import log from 'electron-log';
import dedent from 'dedent';
import probable from 'probable';
import glob from 'glob';
import unzipper from 'unzipper';
import Tiers from 'shared/tiers';
import getLocalIP from 'main/lib/local-ip';
import Scorebot from 'main/lib/scorebot';
import RconClient from 'main/lib/rcon-client';
import Worldgen from 'main/lib/worldgen';
import Argparse from 'main/lib/argparse';
import Application from 'main/constants/application';
import GameSettings from 'main/constants/gamesettings';

import * as Sqrl from 'squirrelly';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';

import { promisify } from 'util';
import { flatten, random } from 'lodash';
import { ping } from '@network-utils/tcp-ping';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { parseCupRound, parseMapForMatch, snooze, toOrdinalSuffix } from 'shared/util';
import { parseCompType, walk } from 'main/lib/util';
import { Match, Tournament, MatchId, Conference, PromotionConference } from 'main/lib/league/types';
import { League, Cup, Division } from 'main/lib/league';
import { Minor, Stage } from 'main/lib/circuit';


/**
 * ------------------------------------
 * CONSTANTS AND VARIABLES
 * ------------------------------------
 */

// set up bot weapon prefs probability table
const weaponPrefsProbabilityTable = probable.createTableFromSizes([
  [ GameSettings.BOT_WEAPONPREFS_PROBABILITY_RIFLE, 'Rifle' ],       // 3x more likely
  [ GameSettings.BOT_WEAPONPREFS_PROBABILITY_SNIPER, 'Sniper' ]      // 1x more likely
]);


// local variables
let steampath: string;
let gameproc: ChildProcessWithoutNullStreams;
let gameproc_server: ChildProcessWithoutNullStreams;
let rcon: any;
let scorebot: Scorebot.Scorebot;
let evt: IpcMainEvent;
let request: IpcRequest<PlayRequest>;


// game-state vars
let score = [ 0, 0 ];
let otscore = [ 0, 0 ];
let gameislive = false;
let halftime = false;
let is_ot = false;


// these will be used later when launching/closing the game
let cs16_enabled = false;
let basedir: string;
let botconfig: string;
let gamedir: string;
let logfile: string;
let servercfgfile: string;
let profile: Models.Profile;
let competition: Models.Competition;
let queue: Models.ActionQueue;
let isleague: boolean;
let iscup: boolean;
let iscircuit: boolean;
let compobj: League | Cup | Minor;
let hostname_suffix: string;
let conf: Conference | PromotionConference;
let divobj: Division;
let match: Match;
let currStage: Stage;
let allow_ot: boolean;
let team1: Models.Team;
let team2: Models.Team;
let tourneyobj: Tournament;
let allow_draw = false;
let is_postseason: boolean;
let is_playoffs: boolean;
let cvar_maxrounds: number;
let cvar_freezetime: number;


// set up the steam path
if( is.osx() ) {
  steampath = `${os.homedir()}/Library/Application Support/Steam`;
} else {
  steampath = 'D:/Steam';
}


/**
 * ------------------------------------
 * POPULATE ASYNC VARS
 *
 * This function must be called
 * before launching the game.
 * ------------------------------------
 */

async function initAsyncVars( ipcevt: IpcMainEvent, ipcreq: IpcRequest<PlayRequest> ) {
  // set up ipc vars
  evt = ipcevt;
  request = ipcreq;

  // set up async vars
  profile = await Models.Profile.getActiveProfile();
  cs16_enabled = profile.settings.cs16_enabled;
  cvar_maxrounds = profile.settings.maxrounds || GameSettings.SERVER_CVAR_MAXROUNDS;
  cvar_freezetime = profile.settings.freezetime || GameSettings.SERVER_CVAR_FREEZETIME;
  competition = ( await Models.Competition.findAllByTeam( profile.Team.id ) ).find( c => c.id === ipcreq.params.compId );
  queue = await Models.ActionQueue.findByPk( ipcreq.params.quid );
  [ isleague, iscup, iscircuit ] = parseCompType( competition.Comptype.name );

  // set up cs16-specific vars
  if( cs16_enabled ) {
    basedir = GameSettings.CS16_BASEDIR;
    botconfig = GameSettings.CS16_BOT_CONFIG;
    gamedir = GameSettings.CS16_GAMEDIR;
    logfile = GameSettings.CS16_LOGFILE;
    servercfgfile = GameSettings.CS16_SERVER_CONFIG_FILE;
  } else {
    basedir = GameSettings.CSGO_BASEDIR;
    botconfig = GameSettings.CSGO_BOT_CONFIG;
    gamedir = GameSettings.CSGO_GAMEDIR;
    logfile = GameSettings.CSGO_LOGFILE;
    servercfgfile = GameSettings.CSGO_SERVER_CONFIG_FILE;
  }

  return Promise.resolve();
}


/**
 * ------------------------------------
 * RCON FUNCTIONALITY
 * ------------------------------------
 */

function delayedping( address: string, port: number, attempts = 1, delay = 5000 ) {
  return new Promise( ( resolve, reject ) => {
    // if CS16, nothing to ping as RCON uses UDP.
    // so just delay and return true...
    if( cs16_enabled ) {
      return setTimeout( () => resolve( true ), delay );
    }

    setTimeout( () => {
      const cnx = ping({ address, port, attempts });

      // bail if our response contained any errors
      cnx.then( res => {
        if( res.errors && res.errors.length > 0 ) {
          reject( res.errors[ 0 ].error );
        }

        resolve( res );
      });

      // catch-all for errors
      cnx.catch( err => {
        reject( err );
      });
    }, delay );
  });
}


function rconconnect( opts: any ) {
  return new Promise( ( resolve, reject ) => {
    const cnx = new RconClient( opts.host, opts.port, opts.password, { tcp: !cs16_enabled });
    cnx.on( 'auth', () => resolve( cnx ) );
    cnx.on( 'error', ( err: any ) => reject( err ) );
    cnx.connect();
  });
}


async function initrcon( ip: string = null ): Promise<any> {
  // get our ip if it was not provided
  if( !ip ) {
    ip = getIP();
  }

  // try n-times before giving up
  for( let i = 1; i <= GameSettings.RCON_MAX_ATTEMPTS; i++ ) {
    log.info( `waiting for rcon to open. attempt #${i}...` );

    // wait for ip:port to be open then
    // attempt to connect to rcon
    try {
      await delayedping( ip, GameSettings.RCON_PORT );

      const rcon = await rconconnect({
        host: ip,
        port: GameSettings.RCON_PORT,
        password: GameSettings.RCON_PASSWORD,
      });

      log.info( 'connection to server established.' );
      return Promise.resolve( rcon );
    } catch( error ) {
      log.debug( error );
    }
  }

  // if we got this far, we couldn't connect, give up.
  return Promise.reject( 'Could not connect to gameserver.' );
}


/**
 * ------------------------------------
 * MISC. HELPER FUNCTIONS
 * ------------------------------------
 */

function getIP() {
  const localips = getLocalIP();
  return localips.filter( ip => ip !== '127.0.0.1' )[ 0 ];
}


function getSquads() {
  // filter user from squads
  let squad1 = team1.Players.filter( p => p.alias !== profile.Player.alias );
  let squad2 = team2.Players.filter( p => p.alias !== profile.Player.alias );

  // replace squad with starters
  const starters1 = squad1.filter( p => p.starter );
  const starters2 = squad2.filter( p => p.starter );

  if( starters1.length >= GameSettings.SQUAD_STARTERS_NUM ) {
    squad1 = starters1;
  }

  if( starters2.length >= GameSettings.SQUAD_STARTERS_NUM ) {
    squad2 = starters2;
  }

  // make sure each squad has enough players
  squad1 = squad1.slice( 0, Application.SQUAD_MIN_LENGTH );
  squad2 = squad2.slice( 0, Application.SQUAD_MIN_LENGTH );

  // now trim the user's squad by one
  if( team1.id === profile.Team.id ) {
    squad1 = squad1.slice( 0, GameSettings.SQUAD_STARTERS_NUM - 1 );
  }

  if( team2.id === profile.Team.id ) {
    squad2 = squad2.slice( 0, GameSettings.SQUAD_STARTERS_NUM - 1 );
  }

  // we have our squads
  return [ squad1, squad2 ];
}


function generateBotSkill( p: Models.Player ) {
  const tier = Tiers[ p.tier ];
  const templates = tier.templates;
  const idx = random( 0, templates.length - 1 );
  const weaponpref = weaponPrefsProbabilityTable.roll();

  // build the bot profile fields
  const name = `${templates[ idx ].name}+${weaponpref} ${p.alias}`;
  const skill = p.stats && p.stats.skill;
  const voicepitch = random( GameSettings.BOT_VOICEPITCH_MIN, GameSettings.BOT_VOICEPITCH_MAX );

  // if skill overrides exist, use them
  if( skill ) {
    return dedent`
      ${name}
        Skill = ${Math.floor( skill )}
        VoicePitch = ${voicepitch}
      End\n
    `;
  }

  return dedent`
    ${name}
      VoicePitch = ${voicepitch}
    End\n
  `;
}


function addSquadsToServer( squads: Models.Player[][] ) {
  const botadd_cmd = squads.map( ( squad, idx ) => (
    squad
      .map( p => dedent`
        bot_difficulty ${Tiers[ p.tier ].difficulty};
        bot_add_${idx === 0 ? 'ct' : 't'} ${p.alias}
      `)
      .join( ';' )
      .replace( /\n/g, '' )
  ));

  // for cs16 each rcon command much be run separately
  if( cs16_enabled ) {
    const cmds = flatten( botadd_cmd.map( c => c.split( ';' ) ) );
    return Promise.all( cmds.map( c => rcon.send( c ) ) );
  }

  return Promise.all( botadd_cmd.map( c => rcon.send( c ) ) );
}


/**
 * ------------------------------------
 * CONFIG FILE HOUSEKEEPING
 * ------------------------------------
 */

// grab all game files.
//
// e.g.: /some/long/path/resources/gamefiles/[cstrike|csgo]/maps/de_cpl_mill.bsp
function getGameFiles() {
  const allfiles: string[] = walk( path.join( __dirname, GameSettings.GAMEFILES_BASEDIR, gamedir ) );
  const gamefiles = allfiles.map( item => {
    // skip zip files
    const ext = path.extname( item );

    if( ext === '.zip' ) {
      return;
    }

    // this is our dir tree
    const tree = item.split( path.sep );

    // isolate the current game's files and offset
    // the index by 1 to omit the top-level dir
    const idx = tree.indexOf( gamedir );
    return tree.slice( idx + 1 ).join( path.sep );
  });

  return gamefiles.filter( g => g );
}


async function extract() {
  const globAsync = promisify( glob );
  const sourcedir = path.join( __dirname, GameSettings.GAMEFILES_BASEDIR, gamedir );
  const targetdir = path.join( steampath, basedir, gamedir );
  const files = await globAsync( '**/*.zip', { cwd: sourcedir });

  // [ 'amxmodx.zip', 'maps.zip' ]
  const unzipped = files.map( file => {
    return new Promise( resolve => {
      fs
        .createReadStream( path.join( sourcedir, file ) )
        .pipe( unzipper.Extract({ path: targetdir }) )
        .on( 'close', () => resolve( true ) )
      ;
    });
  });

  return Promise.all( unzipped );
}


function backup( extra = [] as string[] ) {
  let gamefiles = getGameFiles();

  if( extra.length > 0 ) {
    gamefiles = [ ...gamefiles, ...extra ];
  }

  gamefiles.forEach( item => {
    const backupfilename = path.basename( item ) + '.original';
    const backuppath = path.join( steampath, basedir, gamedir, path.dirname( item ), backupfilename );
    const targetpath = path.join( steampath, basedir, gamedir, item );

    if( fs.existsSync( targetpath ) && !fs.existsSync( backuppath ) ) {
      fs.copyFileSync( targetpath, backuppath );
    }
  });

  return Promise.resolve();
}


function restore( extra = [] as string[], ignorelist = [] as string[] ) {
  let gamefiles = getGameFiles();

  if( extra.length > 0 ) {
    gamefiles = [ ...gamefiles, ...extra ];
  }

  gamefiles.forEach( item => {
    const backupfilename = path.basename( item ) + '.original';
    const backuppath = path.join( steampath, basedir, gamedir, path.dirname( item ), backupfilename );
    const targetpath = path.join( steampath, basedir, gamedir, item );

    if( ignorelist.includes( path.basename( item ) ) ) {
      return;
    }

    if( fs.existsSync( targetpath ) && fs.existsSync( backuppath ) ) {
      fs.copyFileSync( backuppath, targetpath );
    }
  });

  return Promise.resolve();
}


function copy() {
  const gamefiles = getGameFiles();

  gamefiles.forEach( item => {
    const sourcepath = path.join( __dirname, GameSettings.GAMEFILES_BASEDIR, gamedir, item );
    const targetpath = path.join( steampath, basedir, gamedir, item );
    const parents = path.dirname( targetpath );

    // make the dirs if they don't already exist
    if( !fs.existsSync( parents ) ) {
      fs.mkdirSync( parents, { recursive: true });
    }

    fs.copyFileSync( sourcepath, targetpath );
  });

  return Promise.resolve();
}


async function cleanup() {
  log.info( 'connection closed to gameserver. cleaning up...' );

  // clean up connections to processes and/or files
  gameproc.kill();
  scorebot.unwatch();

  if( cs16_enabled ) {
    gameproc_server.kill();
  }

  // set up any extra files to restore
  // based on the game that's enabled
  const extrafiles = [];

  if( !cs16_enabled ) {
    extrafiles.push( GameSettings.CSGO_LANGUAGE_FILE );
  }

  // ignore dlls for cs16
  const ignorelist = [];

  if( cs16_enabled ) {
    ignorelist.push( path.basename( GameSettings.CS16_DLL_BOTS ) );
  }

  // restore modified config files and clean up the log file
  restore( extrafiles, ignorelist );

  try {
    await fs.promises.unlink( path.join( steampath, basedir, cs16_enabled ? '' : gamedir, logfile ) );
  } catch( error ) {
    log.error( error );
  }

  // reset game-state vars
  score = [ 0, 0 ];
  otscore = [ 0, 0 ];
  gameislive = false;
  halftime = false;
  is_ot = false;

  return Promise.resolve();
}


/**
 * ------------------------------------
 * CONFIG FILE GENERATORS
 * ------------------------------------
 */

async function generateGameModeConfig( data: any ) {
  // generate file
  const gmfile = path.join( steampath, GameSettings.CSGO_BASEDIR, GameSettings.CSGO_GAMEDIR, GameSettings.CSGO_GAMEMODES_FILE );
  const gmfiletpl = await fs.promises.readFile( gmfile, 'utf8' );
  return fs.promises.writeFile( gmfile, Sqrl.render( gmfiletpl, data ) );
}


async function generateServerConfig( data: any ) {
  // generate config file
  const targetcfg = path.join( steampath, basedir, gamedir, servercfgfile );
  const configtpl = await fs.promises.readFile( targetcfg, 'utf8' );
  return fs.promises.writeFile( targetcfg, Sqrl.render( configtpl, data ) );
}


async function generateBotConfig( squad1: Models.Player[], squad2: Models.Player[] ) {
  const botcfg = path.join( steampath, basedir, gamedir, botconfig );
  const configtpl = await fs.promises.readFile( botcfg, 'utf8' );

  return fs.promises.writeFile(
    botcfg,
    Sqrl.render( configtpl, {
      squad1: squad1.map( generateBotSkill ),
      squad2: squad2.map( generateBotSkill )
    })
  );
}


async function generateScoreboardFile() {
  // patch scoreboard the scoreboard file
  // to remove the BOT prefixes
  const scbfile = path.join( steampath, GameSettings.CSGO_BASEDIR, GameSettings.CSGO_GAMEDIR, GameSettings.CSGO_LANGUAGE_FILE );

  // read/replace the BOT prefix
  const content = await fs.promises.readFile( scbfile, 'utf16le' );
  const newcontent = content
    .replace( '"BOT %s1', '"%s1' )
    .replace(
      '"SFUI_scoreboard_lbl_bot"	"BOT"',
      '"SFUI_scoreboard_lbl_bot"	"5"',
    )
  ;
  return fs.promises.writeFile( scbfile, newcontent, 'utf16le' );
}


async function generateMotdFile( data: any ) {
  const motdcfg = path.join( steampath, basedir, gamedir, GameSettings.CS16_MOTD_FILE );
  const motdtpl = await fs.promises.readFile( motdcfg, 'utf8' );

  return fs.promises.writeFile(
    motdcfg,
    Sqrl.render( motdtpl, data ).replace(/\s{2,}/gm, '')
  );
}


/**
 * ------------------------------------
 * GAME LAUNCHER FUNCTIONS
 * ------------------------------------
 */

function launchCSGO( map = 'de_dust2' ) {
  const commonflags = [
    '+map', map,
    '+game_mode', '1',
    '-usercon',
    '-gamemodes_serverfile', GameSettings.CSGO_GAMEMODES_FILE
  ];

  if( is.osx() ) {
    gameproc = spawn(
      'open',
      [ `steam://rungameid/${GameSettings.CSGO_APPID}//'${commonflags.join( ' ' )}'` ],
      { shell: true }
    );
  } else {
    gameproc = spawn(
      'steam.exe',
      [
        '-applaunch', GameSettings.CSGO_APPID.toString(),
        ...commonflags
      ],
      { cwd: steampath }
    );
  }
}


function launchCS16Server( map = 'de_dust2' ) {
  // @note: only works for win32
  if( is.osx() ) {
    return;
  }

  // check if `steam_appid.txt` file exists. write cstrike
  // appid to it before launching the game
  const txtpath = path.join( steampath, basedir, 'steam_appid.txt' );

  if( !fs.existsSync( txtpath ) ) {
    fs.writeFileSync( txtpath, GameSettings.CS16_APPID.toString() );
  }

  // launch the game
  gameproc_server = spawn(
    GameSettings.CS16_HLDS_EXE,
    [
      '-console',
      '-game', GameSettings.CS16_GAMEDIR,
      '-dll', GameSettings.CS16_DLL_METAMOD,                                // metamod
      '-beta',                                                              // enable mp_swapteams
      '-bots',                                                              // enable bots
      '-condebug',
      '+localinfo', 'mm_gamedll', GameSettings.CS16_DLL_BOTS,               // dll with bots
      '+ip', getIP(),
      '+servercfgfile', path.basename( servercfgfile ),
      '+maxplayers', '12',
      '+map', parseMapForMatch( map, cs16_enabled ),
    ],
    {
      cwd: path.join( steampath, GameSettings.CS16_BASEDIR ),
      shell: true
    }
  );
}


function launchCS16Client() {
  // @note: only works for win32
  if( is.osx() ) {
    return;
  }

  // launch the game
  gameproc = spawn(
    'steam.exe',
    [
      '-applaunch', GameSettings.CS16_APPID.toString(),
      '+connect', getIP(),
    ],
    { cwd: steampath }
  );
}


/**
 * ------------------------------------
 * SCOREBOT EVENT HANDLERS
 * ------------------------------------
 */

async function sbEventHandler_Say( text: string ) {
  switch( text ) {
    case '.ready':
      cs16_enabled
        ? await sbEventHandler_CS16_ReadyUp()
        : await rcon.send( 'mp_warmup_end' )
      ;
      break;
    default:
      break;
  }
}


function sbEventHandler_CS16_ReadyUp() {
  // bail if game is already live
  if( gameislive ) {
    return Promise.resolve( false );
  }

  gameislive = true;
  return rcon.send( 'exec liga-lo3.cfg' );
}


async function sbEventHandler_Round_Over( result: { winner: number; score: number[] } ) {
  // do not record anything if we're not live
  if( !gameislive ) {
    return Promise.resolve( false );
  }

  // scoped util functions
  const getCurrentScore = () => `${team1.name} ${score[ Scorebot.TeamEnum.CT ]} - ${score[ Scorebot.TeamEnum.TERRORIST ]} ${team2.name}`;
  const getTotalRounds  = ( total: number, current: number ) => total + current;
  const getTeamScore    = ( teamid: number ) => is_ot ? otscore[ teamid ] : score[ teamid ];

  // invert the score if past half-time
  if( halftime ) {
    score[ 1 - result.winner ] += 1;
    otscore[ 1 - result.winner ] += +is_ot;
  } else {
    score[ result.winner ] += 1;
    otscore[ result.winner ] += +is_ot;
  }

  // report current score
  await rcon.send( `say * * * ROUND OVER | ${getCurrentScore()} * * *` );

  // set up vars
  const totalrounds     = is_ot ? otscore.reduce( getTotalRounds ) : score.reduce( getTotalRounds );
  const halftimerounds  = cvar_maxrounds / 2;
  const clinchrounds    = ( cvar_maxrounds / 2 ) + 1;
  let gameover = false;

  // we've reached half-time
  if( totalrounds === halftimerounds ) {
    halftime = true;
    gameislive = false;
    await rcon.send( `say * * * HALF-TIME | ${getCurrentScore()} * * *` );
    await snooze( GameSettings.CS16_DELAY_HALFTIME );
    await rcon.send( 'exec liga-halftime.cfg' );
    await rcon.send( 'say * * * TO START THE SECOND-HALF TYPE: .ready * * *' );
    return Promise.resolve();
  }

  // do we have to start overtime?
  if(
    totalrounds === cvar_maxrounds
    && !allow_draw
    && getTeamScore( Scorebot.TeamEnum.CT ) === getTeamScore( Scorebot.TeamEnum.TERRORIST )
  ) {
    halftime = false;
    gameislive = false;
    cvar_maxrounds = GameSettings.SERVER_CVAR_MAXROUNDS_OT;
    is_ot = true;
    otscore = [ 0, 0 ];
    await rcon.send( `say * * * OVERTIME | ${getCurrentScore()} * * *` );
    await snooze( GameSettings.CS16_DELAY_HALFTIME );
    await rcon.send( 'exec liga-halftime.cfg' );
    await rcon.send( 'say * * * TO START THE OVERTIME TYPE: .ready * * *' );
    return Promise.resolve();
  }

  // game is over
  if(
    totalrounds === cvar_maxrounds
    || getTeamScore( Scorebot.TeamEnum.CT ) === clinchrounds
    || getTeamScore( Scorebot.TeamEnum.TERRORIST ) === clinchrounds
  ) {
    gameover = true;
    await rcon.send( `say * * * GAME OVER | ${getCurrentScore()} * * *` );
    await rcon.send( `say * * * SHUTTING DOWN SERVER IN ${GameSettings.CS16_DELAY_GAMEOVER / 1000}s * * *` );
    await rcon.send( 'bot_quota 0' );
  }

  // wait a few seconds before shutting down the server and saving the results
  await snooze( GameSettings.CS16_DELAY_GAMEOVER );

  if( gameover ) {
    log.info( 'GAME IS OVER. Shutting down server...' );
    await rcon.send( 'exit' );
    rcon.disconnect();
    return sbEventHandler_Game_Over({ map: '', score });
  }

  return Promise.resolve();
}


async function sbEventHandler_Game_Over( result: { map: string; score: number[] }) {
  log.info( 'GAME IS OVER', result );
  tourneyobj.score( match.id, result.score );
  competition.data = compobj.save();

  // record the match
  const matchobj = await Models.Match.create({
    payload: {
      match,
      confId: conf?.id,
      divId: divobj?.name,
      is_postseason: is_postseason || false,
      is_playoffs: is_playoffs || false,
      stageName: currStage ? currStage.name : null,
    },
    date: profile.currentDate,
  });

  await Promise.all([
    matchobj.setCompetition( competition.id ),
    matchobj.setTeams([ team1, team2 ]),
    queue.update({ completed: true }),
  ]);

  // let the front-end know the game is over
  evt.sender.send( request.responsechannel );
  return Promise.resolve();
}


/**
 * ------------------------------------
 * THE MAIN IPC HANDLER
 * ------------------------------------
 */

interface PlayRequest {
  quid: number;
  compId: number;
  matchId: MatchId;
  sim: boolean;
}


async function play( ipcevt: IpcMainEvent, ipcreq: IpcRequest<PlayRequest> ) {
  // --------------------------------
  // SET UP VARS
  // --------------------------------

  let motd_team1_subtitle: any = '';
  let motd_team2_subtitle: any = '';

  // populate values for the async vars
  await initAsyncVars( ipcevt, ipcreq );

  // populate the above vars depending
  // on the competition type
  if( isleague ) {
    // grab the match information
    const leagueobj = League.restore( competition.data );
    const postseason = leagueobj.isGroupStageDone();
    divobj = leagueobj.getDivisionByCompetitorId( profile.Team.id );

    // assigned vars will differ depending
    // on the current stage of the season
    if( postseason ) {
      conf = divobj.getCompetitorPromotionConferenceAndSeedNumById( profile.Team.id )[ 0 ];
      allow_ot = true;
      allow_draw = false;
      tourneyobj = conf.duelObj;
      match = conf.duelObj.findMatch( request.params.matchId );
      team1 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, match.p[ 0 ] ).name );
      team2 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, match.p[ 1 ] ).name );
      is_postseason = true;
      hostname_suffix = `${divobj.name} | Promotion ${parseCupRound( conf.duelObj.currentRound() )}`;
    } else {
      conf = divobj.getCompetitorConferenceAndSeedNumById( profile.Team.id )[ 0 ];
      allow_ot = false;
      allow_draw = true;
      is_postseason = false;
      tourneyobj = conf.groupObj;
      match = conf.groupObj.findMatch( request.params.matchId );
      team1 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, match.p[ 0 ] ).name );
      team2 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, match.p[ 1 ] ).name );
      hostname_suffix = divobj.name;
    }

    // assign the remaining vars
    compobj = leagueobj;
    motd_team1_subtitle = toOrdinalSuffix( divobj.getCompetitorStandingsById( team1.id ).gpos );
    motd_team2_subtitle = toOrdinalSuffix( divobj.getCompetitorStandingsById( team2.id ).gpos );
  } else if( iscup ) {
    // grab the match information
    const cupobj = Cup.restore( competition.data );

    // assign to the respective vars
    allow_ot = true;
    allow_draw = false;
    compobj = cupobj;
    tourneyobj = cupobj.duelObj;
    match = cupobj.duelObj.findMatch( request.params.matchId );
    team1 = await Models.Team.findByName( cupobj.getCompetitorBySeed( match.p[ 0 ] ).name );
    team2 = await Models.Team.findByName( cupobj.getCompetitorBySeed( match.p[ 1 ] ).name );
    hostname_suffix = parseCupRound( cupobj.duelObj.currentRound() );
    motd_team1_subtitle = Tiers[ team1.tier ].name;
    motd_team2_subtitle = Tiers[ team2.tier ].name;
  } else if( iscircuit ) {
    const minorObj = Minor.restore( competition.data );
    compobj = minorObj;
    currStage = compobj.getCurrentStage();
    is_playoffs = !!currStage.duelObj;
    allow_ot = is_playoffs;
    allow_draw = !is_playoffs;
    tourneyobj = currStage.duelObj || currStage.groupObj;
    match = tourneyobj.findMatch( request.params.matchId );
    team1 = await Models.Team.findByName( currStage.getCompetitorBySeed( match.p[ 0 ], is_playoffs ).name );
    team2 = await Models.Team.findByName( currStage.getCompetitorBySeed( match.p[ 1 ], is_playoffs ).name );
    hostname_suffix = currStage.name;
    motd_team1_subtitle = Tiers[ team1.tier ].name;
    motd_team2_subtitle = Tiers[ team2.tier ].name;
  }

  // generate each team's squads
  const squads = getSquads();

  // --------------------------------
  // SIMULATE THE GAME?
  // --------------------------------
  if( Argparse[ 'sim-games' ] || request.params.sim ) {
    switch( profile.settings.sim_mode ) {
      case Application.SIM_MODE_ALWAYS_WIN:
        tourneyobj.score( match.id, [ team1.id === profile.Team.id ? 1 : 0, team2.id === profile.Team.id ? 1 : 0 ] );
        break;
      case Application.SIM_MODE_ALWAYS_LOSE:
        tourneyobj.score( match.id, [ team1.id === profile.Team.id ? 0 : 1, team2.id === profile.Team.id ? 0 : 1 ] );
        break;
      default:
        tourneyobj.score( match.id, Worldgen.Score( team1, team2, allow_draw, true ) );
    }
    competition.data = compobj.save();

    // record the match
    const matchobj = await Models.Match.create({
      payload: {
        match,
        confId: conf?.id,
        divId: divobj ? divobj.name : null,
        is_postseason: is_postseason || false,
        is_playoffs: is_playoffs || false,
        stageName: currStage ? currStage.name : null,
      },
      date: profile.currentDate,
    });

    await Promise.all([
      matchobj.setCompetition( competition.id ),
      matchobj.setTeams([ team1, team2 ]),
      queue.update({ completed: true }),
    ]);
    return evt.sender.send( request.responsechannel );
  }

  // --------------------------------
  // SET UP CONFIG FILES
  // --------------------------------

  const server_hostname = `${compobj.name}: ${competition.Continent.name} | ${hostname_suffix}`;

  // extract any zip files
  await extract();

  // set up any extra files to backup
  // based on the game that's enabled
  const extrafiles = [];

  if( !cs16_enabled ) {
    extrafiles.push( GameSettings.CSGO_LANGUAGE_FILE );
  }

  // backup files and copy ours over
  await backup( extrafiles );
  await copy();

  // generate the gamemodes text file
  // (csgo only)
  if( !cs16_enabled ) {
    await generateGameModeConfig({
      server_config_file: path.basename( GameSettings.CSGO_SERVER_CONFIG_FILE )
    });
  }

  // generate motd
  await generateMotdFile({
    compobj,
    competition,
    team1,
    team2,
    title: server_hostname,
    hostname_suffix: hostname_suffix,
    team1_subtitle: motd_team1_subtitle,
    team2_subtitle: motd_team2_subtitle,
  });

  // generate server config
  await generateServerConfig({
    demo: Application.DEMO_MODE,
    freezetime: cvar_freezetime,
    hostname: server_hostname,
    logfile: logfile,
    maxrounds: cvar_maxrounds,
    ot: allow_ot,
    rcon_password: GameSettings.RCON_PASSWORD,
    teamflag_ct: team1.Country.code,
    teamflag_t: team2.Country.code,
    teamname_ct: team1.name,
    teamname_t: team2.name,
    shortname_ct: team1.shortName || null,
    shortname_t: team2?.shortName || null,
    stat_ct: motd_team1_subtitle,
    stat_t: motd_team2_subtitle,
    match_stat: hostname_suffix,
  });

  // generate bot config
  await generateBotConfig( squads[ 0 ], squads[ 1 ] );

  // remove bot prefixes from scoreboard
  // (csgo only)
  if( !cs16_enabled ) {
    await generateScoreboardFile();
  }

  // --------------------------------
  // GAME + RCON SET UP
  // --------------------------------

  // launch the game (or server if cs16)
  if( cs16_enabled ) {
    launchCS16Server( match.data.map );
  } else {
    launchCSGO( match.data.map );
  }

  // connect to rcon and add cleanup listener
  rcon = await initrcon();
  rcon.on( 'end', cleanup );

  // add this match's bots
  await addSquadsToServer( squads );

  // run CS16-specific logic
  if( cs16_enabled ) {
    await rcon.send( 'exec liga-warmup.cfg' );
    launchCS16Client();
  }

  // --------------------------------
  // SCOREBOT SET UP + EVENT HANDLERS
  // --------------------------------

  // start watching log file
  scorebot = new Scorebot.Scorebot( path.join( steampath, basedir, cs16_enabled ? '' : gamedir, logfile ) );

  // event handlers
  scorebot.on( Scorebot.GameEvents.SAY, sbEventHandler_Say );
  scorebot.on( Scorebot.GameEvents.ROUND_OVER, sbEventHandler_Round_Over );
  scorebot.on( Scorebot.GameEvents.GAME_OVER, sbEventHandler_Game_Over );
}


export default function() {
  ipcMain.on( IPCRouting.Competition.PLAY, play );
}
