import os from 'os';
import path from 'path';
import fs from 'fs';
import is from 'electron-is';
import log from 'electron-log';
import dedent from 'dedent';
import probable from 'probable';
import getLocalIP from 'main/lib/local-ip';
import Scorebot from 'main/lib/scorebot';
import RconClient from 'main/lib/rconclient';
import Worldgen from 'main/lib/worldgen';
import Argparse from 'main/lib/argparse';
import Application from 'main/constants/application';

import * as Sqrl from 'squirrelly';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';

import { random } from 'lodash';
import { ping } from '@network-utils/tcp-ping';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { parseCompType, walk } from 'main/lib/util';
import { Match, Tournament, MatchId, Conference, PromotionConference } from 'main/lib/league/types';
import { League, Cup, Division } from 'main/lib/league';
import { genMappool } from 'main/lib/worldgen/competition';


/**
 * ------------------------------------
 * CONSTANTS AND VARIABLES
 * ------------------------------------
 */

// general settings
const BOT_VOICEPITCH_MAX                  = 125;
const BOT_VOICEPITCH_MIN                  = 80;
const BOT_WEAPONPREFS_PROBABILITY_RIFLE   = 3;
const BOT_WEAPONPREFS_PROBABILITY_SNIPER  = 1;
const GAMEFILES_BASEDIR                   = 'resources/gamefiles';
const SQUAD_STARTERS_NUM                  = 5;


// cs16 settings
const CS16_APPID                          = 10;
const CS16_BASEDIR                        = 'steamapps/common/Half-Life';
const CS16_BOT_CONFIG                     = 'botprofile.db';
const CS16_DLL_FILE                       = 'dlls/liga.dll';
const CS16_GAMEDIR                        = 'cstrike';
const CS16_HLDS_EXE                       = 'hlds.exe';
const CS16_LOGFILE                        = 'qconsole.log';
const CS16_SERVER_CONFIG_FILE             = 'liga.cfg';


// csgo settings
const CSGO_APPID                          = 730;
const CSGO_BOT_CONFIG                     = 'botprofile.db';
const CSGO_BASEDIR                        = 'steamapps/common/Counter-Strike Global Offensive';
const CSGO_GAMEDIR                        = 'csgo';
const CSGO_GAMEMODES_FILE                 = 'gamemodes_liga.txt';
const CSGO_LANGUAGE_FILE                  = 'resource/csgo_english.txt';
const CSGO_LOGFILE                        = 'logs/liga.log';
const CSGO_SERVER_CONFIG_FILE             = 'cfg/liga.cfg';


// rcon settings
const RCON_MAX_ATTEMPTS                   = 15;
const RCON_PASSWORD                       = 'liga';
const RCON_PORT                           = 27015;


// bot difficulty map
const TIER_TO_BOT_DIFFICULTY = [
  {
    difficulty: 3,
    templates: [ 'Expert', 'Elite' ],
  },
  {
    difficulty: 2,
    templates: [ 'Tough', 'Hard', 'VeryHard' ],
  },
  {
    difficulty: 2,
    templates: [ 'Tough', 'Hard', 'VeryHard' ],
  },
  {
    difficulty: 1,
    templates: [ 'Fair', 'Normal' ],
  },
  {
    difficulty: 0,
    templates: [ 'Easy' ],
  }
];


// set up bot weapon prefs probability table
const weaponPrefsProbabilityTable = probable.createTableFromSizes([
  [ BOT_WEAPONPREFS_PROBABILITY_RIFLE, 'Rifle' ],       // 3x more likely
  [ BOT_WEAPONPREFS_PROBABILITY_SNIPER, 'Sniper' ]      // 1x more likely
]);


// local variables
let steampath: string;
let gameproc: ChildProcessWithoutNullStreams;
let gameproc_server: ChildProcessWithoutNullStreams;
let rcon: any;
let scorebot: Scorebot.Scorebot;


// these are populated async
let cs16_enabled = false;
let basedir = CSGO_BASEDIR;
let botconfig = CSGO_BOT_CONFIG;
let gamedir = CSGO_GAMEDIR;
let logfile = CSGO_LOGFILE;
let servercfgfile = CSGO_SERVER_CONFIG_FILE;


// set up the steam path
if( is.osx() ) {
  steampath = `${os.homedir()}/Library/Application Support/Steam`;
} else {
  steampath = 'D:/Steam';
}


/**
 * ------------------------------------
 * POPULATE ASYNC VARS
 * ------------------------------------
 */

function isCS16Enabled(): Promise<boolean> {
  return new Promise( resolve => {
    setTimeout( () => resolve( true ), 2000 );
  });
}


// this function must be called before launching the game!
async function initAsyncVars() {
  if( !cs16_enabled ) {
    cs16_enabled = await isCS16Enabled();
  }

  if( cs16_enabled ) {
    basedir = CS16_BASEDIR;
    botconfig = CS16_BOT_CONFIG;
    gamedir = CS16_GAMEDIR;
    logfile = CS16_LOGFILE;
    servercfgfile = CS16_SERVER_CONFIG_FILE;
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
      return setTimeout( () => resolve(), delay );
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
  for( let i = 1; i <= RCON_MAX_ATTEMPTS; i++ ) {
    log.info( `waiting for rcon to open. attempt #${i}...` );

    // wait for ip:port to be open then
    // attempt to connect to rcon
    try {
      await delayedping( ip, RCON_PORT );

      const rcon = await rconconnect({
        host: ip,
        port: RCON_PORT,
        password: RCON_PASSWORD,
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


function getSquads( team1: Models.Player[], team2: Models.Player[] ) {
  // load up the whole squad
  let squad1 = team1;
  let squad2 = team2;

  // replace squad with starters if enough are set
  const starters1 = squad1.filter( p => p.starter );
  const starters2 = squad2.filter( p => p.starter );

  if( starters1.length >= SQUAD_STARTERS_NUM ) {
    squad1 = starters1;
  }

  if( starters2.length >= SQUAD_STARTERS_NUM ) {
    squad2 = starters2;
  }

  return [ squad1, squad2 ];
}


function generateBotSkill( p: Models.Player ) {
  const difficulty = TIER_TO_BOT_DIFFICULTY[ p.tier ];
  const template = random( 0, difficulty.templates.length - 1 );
  const weaponpref = weaponPrefsProbabilityTable.roll();

  return dedent`
    ${difficulty.templates[ template ]}+${weaponpref} ${p.alias}
      VoicePitch = ${random( BOT_VOICEPITCH_MIN, BOT_VOICEPITCH_MAX )}
    End\n
  `;
}


/**
 * ------------------------------------
 * CONFIG FILE HOUSEKEEPING
 * ------------------------------------
 */

// trims the first three dirs in order
// to isolate just the files needed
//
// e.g.: [resources/gamefiles/game]/<...>
function trimResourcesPath( item: string ) {
  return item
    .split( path.sep )
    .slice( 3 )
    .join( path.sep )
  ;
}


function backup( extra = [] as string[] ) {
  let tree: string[] = walk( path.join( GAMEFILES_BASEDIR, gamedir ) ).map( trimResourcesPath );

  if( extra.length > 0 ) {
    tree = [ ...tree, ...extra ];
  }

  tree.forEach( item => {
    const backupfilename = path.basename( item ) + '.original';
    const backuppath = path.join( steampath, basedir, gamedir, path.dirname( item ), backupfilename );
    const targetpath = path.join( steampath, basedir, gamedir, item );

    if( fs.existsSync( targetpath ) && !fs.existsSync( backuppath ) ) {
      fs.copyFileSync( targetpath, backuppath );
    }
  });

  return Promise.resolve();
}


function restore( extra = [] as string[] ) {
  let tree: string[] = walk( path.join( GAMEFILES_BASEDIR, gamedir ) ).map( trimResourcesPath );

  if( extra.length > 0 ) {
    tree = [ ...tree, ...extra ];
  }

  tree.forEach( item => {
    const backupfilename = path.basename( item ) + '.original';
    const backuppath = path.join( steampath, basedir, gamedir, path.dirname( item ), backupfilename );
    const targetpath = path.join( steampath, basedir, gamedir, item );

    if( fs.existsSync( targetpath ) && fs.existsSync( backuppath ) ) {
      fs.copyFileSync( backuppath, targetpath );
    }
  });

  return Promise.resolve();
}


function copy() {
  const tree: string[] = walk( path.join( GAMEFILES_BASEDIR, gamedir ) ).map( trimResourcesPath );

  tree.forEach( item => {
    const sourcepath = path.join( __dirname, GAMEFILES_BASEDIR, gamedir, item );
    const targetpath = path.join( steampath, basedir, gamedir, item );
    fs.copyFileSync( sourcepath, targetpath );
  });

  return Promise.resolve();
}


function cleanup() {
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
    extrafiles.push( CSGO_LANGUAGE_FILE );
  }

  // restore modified config files
  restore( extrafiles );

  // clean up the log file
  fs.unlinkSync( path.join( steampath, basedir, gamedir, logfile ) );
}


/**
 * ------------------------------------
 * CONFIG FILE GENERATORS
 * ------------------------------------
 */

async function generateGameModeConfig( data: any ) {
  // generate file
  const gmfile = path.join( steampath, CSGO_BASEDIR, CSGO_GAMEDIR, CSGO_GAMEMODES_FILE );
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
  const scbfile = path.join( steampath, CSGO_BASEDIR, CSGO_GAMEDIR, CSGO_LANGUAGE_FILE );

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
    '-gamemodes_serverfile', CSGO_GAMEMODES_FILE
  ];

  if( is.osx() ) {
    gameproc = spawn(
      'open',
      [ `steam://rungameid/${CSGO_APPID}//'${commonflags.join( ' ' )}'` ],
      { shell: true }
    );
  } else {
    gameproc = spawn(
      'steam.exe',
      [
        '-applaunch', CSGO_APPID.toString(),
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

  // launch the game
  gameproc_server = spawn(
    CS16_HLDS_EXE,
    [
      '+map', map,
      '+maxplayers', '12',
      '+servercfgfile', path.basename( servercfgfile ),
      '+ip', getIP(),
      '-game', CS16_GAMEDIR,
      '-dll', CS16_DLL_FILE,
      '-console',
      '-beta',
      '-bots',
      '-condebug',
    ],
    {
      cwd: path.join( steampath, CS16_BASEDIR ),
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
      '-applaunch', CS16_APPID.toString(),
      '+connect', getIP(),
    ],
    { cwd: steampath }
  );
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


async function play( evt: IpcMainEvent, request: IpcRequest<PlayRequest> ) {
  // --------------------------------
  // SET UP VARS
  // --------------------------------

  // populate values for the async vars
  await initAsyncVars();

  // load user's profile and the competition object
  const profile = await Models.Profile.getActiveProfile();
  const competition = profile.Team.Competitions.find( c => c.id === request.params.compId );
  const queue = await Models.ActionQueue.findByPk( request.params.quid );
  const [ isleague, iscup ] = parseCompType( competition.Comptype.name );

  // these will be used later when launching/closing the game
  let compobj: League | Cup;
  let hostname_suffix: string;
  let conf: Conference | PromotionConference;
  let match: Match;
  let allow_ot: boolean;
  let team1: Models.Team;
  let team2: Models.Team;
  let tourneyobj: Tournament;
  let allow_draw = false;
  let is_postseason: boolean;

  // populate the above vars depending
  // on the competition type
  if( isleague ) {
    // grab the match information
    const leagueobj = League.restore( competition.data );
    const divobj = leagueobj.getDivisionByCompetitorId( profile.Team.id );
    const postseason = leagueobj.isGroupStageDone();

    // assigned vars will differ depending
    // on the current stage of the season
    if( postseason ) {
      conf = divobj.getCompetitorPromotionConferenceAndSeedNumById( profile.Team.id )[ 0 ];
      allow_ot = true;
      tourneyobj = conf.duelObj;
      match = conf.duelObj.findMatch( request.params.matchId );
      team1 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, match.p[ 0 ] ).name );
      team2 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, match.p[ 1 ] ).name );
      is_postseason = true;
    } else {
      conf = divobj.getCompetitorConferenceAndSeedNumById( profile.Team.id )[ 0 ];
      allow_ot = false;
      allow_draw = true;
      tourneyobj = conf.groupObj;
      match = conf.groupObj.findMatch( request.params.matchId );
      team1 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, match.p[ 0 ] ).name );
      team2 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, match.p[ 1 ] ).name );
    }

    // assign the remaining vars
    compobj = leagueobj;
    hostname_suffix = divobj.name;
  } else if( iscup ) {
    // grab the match information
    const cupobj = Cup.restore( competition.data );

    // assign to the respective vars
    allow_ot = true;
    compobj = cupobj;
    tourneyobj = cupobj.duelObj;
    match = cupobj.duelObj.findMatch( request.params.matchId );
    team1 = await Models.Team.findByName( cupobj.getCompetitorBySeed( match.p[ 0 ] ).name );
    team2 = await Models.Team.findByName( cupobj.getCompetitorBySeed( match.p[ 1 ] ).name );
    hostname_suffix = `Round ${match.id.r}`;
  }

  // generate each team's squads
  const squads = getSquads(
    team1.Players.filter( p => p.alias !== profile.Player.alias ),
    team2.Players.filter( p => p.alias !== profile.Player.alias )
  );

  // --------------------------------
  // SIMULATE THE GAME?
  // --------------------------------
  if( Argparse[ 'sim-games' ] || request.params.sim ) {
    tourneyobj.score( match.id, Worldgen.Score( team1, team2, allow_draw ) );
    // tourneyobj.score( match.id, [ team1.id === profile.Team.id ? 1 : 0, team2.id === profile.Team.id ? 1 : 0 ] );
    // tourneyobj.score( match.id, [ team1.id === profile.Team.id ? 0 : 1, team2.id === profile.Team.id ? 0 : 1 ] );
    competition.data = compobj.save();

    // generate new round for league postseason
    if( isleague && compobj.isGroupStageDone() ) {
      const startps = compobj.startPostSeason();

      if( startps ) {
        (compobj.divisions as Division[]).forEach( d => d.promotionConferences.forEach( dd => genMappool( dd.duelObj.rounds() ) ) );
      }

      if( startps || compobj.matchesDone({ s: match.id.s, r: match.id.r }) ) {
        competition.data = compobj.save();
        await Worldgen.Competition.genMatchdays( competition );
      }
    }

    // end the season?
    if( isleague && compobj.isDone() ) {
      compobj.endPostSeason();
      compobj.end();
      competition.data = compobj.save();
    }

    // generate new round for tourney
    if( iscup && compobj.matchesDone({ s: match.id.s, r: match.id.r }) ) {
      await Worldgen.Competition.genMatchdays( competition );
    }

    // record the match
    const matchobj = await Models.Match.create({
      payload: {
        match,
        confId: conf?.id,
        is_postseason: is_postseason || false,
      },
      date: profile.currentDate,
    });

    await Promise.all([
      matchobj.setCompetition( competition.id ),
      matchobj.setTeams([ team1, team2 ]),
      queue.update({ completed: true }),
      competition.save(),
    ]);
    return evt.sender.send( request.responsechannel );
  }

  // --------------------------------
  // SET UP CSGO CONFIG FILES
  // --------------------------------

  // set up any extra files to backup
  // based on the game that's enabled
  const extrafiles = [];

  if( !cs16_enabled ) {
    extrafiles.push( CSGO_LANGUAGE_FILE );
  }

  // backup files and copy ours over
  await backup( extrafiles );
  await copy();

  // generate the gamemodes text file
  // (csgo only)
  if( !cs16_enabled ) {
    await generateGameModeConfig({
      server_config_file: path.basename( CSGO_SERVER_CONFIG_FILE )
    });
  }

  // generate server config
  await generateServerConfig({
    demo: Application.DEMO_MODE,
    hostname: `${compobj.name}: ${competition.Continent.name} — ${hostname_suffix}`,
    logfile: logfile,
    ot: allow_ot,
    rcon_password: RCON_PASSWORD,
    teamflag_ct: team1.Country.code,
    teamflag_t: team2.Country.code,
    teamname_ct: team1.name,
    teamname_t: team2.name,
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

  // launch game server for CS16
  // launch the game for CSGO
  if( cs16_enabled ) {
    launchCS16Server( match.data.map );
  } else {
    launchCSGO( match.data.map );
  }

  // connect to rcon
  rcon = await initrcon();

  // for CS16, we have to launch a client too
  if( cs16_enabled ) {
    launchCS16Client();
  }

  // restore default config files once the rcon connection is closed
  rcon.on( 'end', cleanup );

  // --------------------------------
  // BOT SET UP
  // --------------------------------

  // add this match's bots
  // @todo: not working in CS16
  const botadd_cmd = squads.map( ( squad, idx ) => (
    squad
      .map( p => dedent`
        bot_difficulty ${TIER_TO_BOT_DIFFICULTY[ p.tier ].difficulty};
        bot_add_${idx === 0 ? 'ct' : 't'} ${p.alias}
      `)
      .join( ';' )
      .replace( /\n/g, '' )
  ));

  await Promise.all( botadd_cmd.map( c => rcon.send( c ) ) );

  // --------------------------------
  // SCOREBOT SET UP + EVENT HANDLERS
  // --------------------------------

  // start watching log file
  scorebot = new Scorebot.Scorebot( path.join( steampath, basedir, cs16_enabled ? '' : gamedir, logfile ) );

  scorebot.on( Scorebot.GameEvents.SAY, async ( text: string ) => {
    switch( text ) {
      case '.ready':
        await rcon.send(
          cs16_enabled
            ? 'sv_restart 1'
            : 'mp_warmup_end'
        );
        break;
      default:
        break;
    }
  });

  scorebot.on( Scorebot.GameEvents.GAME_OVER, async ( result: { map: string; score: number[] }) => {
    log.info( 'GAME IS OVER', result );
    tourneyobj.score( match.id, result.score );
    competition.data = compobj.save();

    if( isleague && compobj.isGroupStageDone() ) {
      const startps = compobj.startPostSeason();

      if( startps ) {
        (compobj.divisions as Division[]).forEach( d => d.promotionConferences.forEach( dd => genMappool( dd.duelObj.rounds() ) ) );
      }

      if( startps || compobj.matchesDone({ s: match.id.s, r: match.id.r }) ) {
        competition.data = compobj.save();
        await Worldgen.Competition.genMatchdays( competition );
      }
    }

    // end the season?
    if( isleague && compobj.isDone() ) {
      compobj.endPostSeason();
      compobj.end();
      competition.data = compobj.save();
    }

    // generate new round for tourney
    if( iscup && compobj.matchesDone({ s: match.id.s, r: match.id.r }) ) {
      await Worldgen.Competition.genMatchdays( competition );
    }

    // record the match
    const matchobj = await Models.Match.create({
      payload: {
        match,
        confId: conf?.id,
        is_postseason: is_postseason || false,
      },
      date: profile.currentDate,
    });

    await Promise.all([
      matchobj.setCompetition( competition.id ),
      matchobj.setTeams([ team1, team2 ]),
      queue.update({ completed: true }),
      competition.save(),
    ]);

    evt.sender.send( request.responsechannel );
  });
}


export default function() {
  ipcMain.on( IPCRouting.Competition.PLAY, play );
}
