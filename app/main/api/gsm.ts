import os from 'os';
import path from 'path';
import fs from 'fs';
import is from 'electron-is';
import log from 'electron-log';
import dedent from 'dedent';
import probable from 'probable';
import getLocalIP from 'main/lib/local-ip';
import Scorebot from 'main/lib/scorebot';
import Worldgen from 'main/lib/worldgen';
import Argparse from 'main/lib/argparse';
import Application from 'main/constants/application';

import * as Sqrl from 'squirrelly';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';

import { random } from 'lodash';
import { ping } from '@network-utils/tcp-ping';
import { Rcon } from 'rcon-client';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { parseCompType } from 'main/lib/util';
import { Match, Tournament, MatchId } from 'main/lib/league/types';
import { League, Cup, Division } from 'main/lib/league';
import { genMappool } from 'main/lib/worldgen/competition';


// general settings
const BOT_CONFIG = 'botprofile.db';
const BOT_CONFIG_BACKUP = 'botprofile.original.db';
const BOT_VOICEPITCH_MIN = 80;
const BOT_VOICEPITCH_MAX = 125;
const BOT_WEAPONPREFS_PROBABILITY_RIFLE = 3;
const BOT_WEAPONPREFS_PROBABILITY_SNIPER = 1;
const CSGO_APPID = 730;
const CSGO_BASEDIR = 'steamapps/common/Counter-Strike Global Offensive/csgo';
const CSGO_CFGDIR = 'cfg';
const CSGO_GAMEMODES_FILE = 'gamemodes_liga.txt';
const CSGO_LANGUAGE_FILE = 'csgo_english.txt';
const CSGO_LANGUAGE_FILE_BACKUP = 'csgo_english.original.txt';
const CSGO_LOGFILE = 'logs/liga.log';
const CSGO_RESOURCEDIR = 'resource';
const CSGO_SERVER_CONFIG_FILE = 'liga.cfg';
const RCON_MAX_ATTEMPTS = 15;
const RCON_PASSWORD = 'liga';
const RCON_PORT = 27015;
const SQUAD_STARTERS_NUM = 5;
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


// variables
let steampath: string;
let gameproc: ChildProcessWithoutNullStreams;
let rcon: Rcon;
let scorebot: Scorebot.Scorebot;


// constants
const weaponPrefsProbabilityTable = probable.createTableFromSizes([
  [ BOT_WEAPONPREFS_PROBABILITY_RIFLE, 'Rifle' ],     // 3x more likely
  [ BOT_WEAPONPREFS_PROBABILITY_SNIPER, 'Sniper' ]     // 1x more likely
]);


// set up the steam path
if( is.osx() ) {
  steampath = `${os.homedir()}/Library/Application Support/Steam`;
} else {
  steampath = 'D:/Steam';
}


/**
 * RCON helper functions
 */

function delayedping( address: string, port: number, attempts = 1, delay = 5000 ) {
  return new Promise( ( resolve, reject ) => {
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


async function initrcon( ip: string = null ): Promise<Rcon> {
  // get our ip if it was not provided
  if( !ip ) {
    const localips = getLocalIP();
    [ ip ] = localips.filter( ip => ip !== '127.0.0.1' );
  }

  // try n-times before giving up
  for( let i = 1; i <= RCON_MAX_ATTEMPTS; i++ ) {
    log.info( `waiting for rcon to open. attempt #${i}...` );

    // wait for ip:port to be open then
    // attempt to connect to rcon
    try {
      await delayedping( ip, RCON_PORT );

      const rcon = await Rcon.connect({
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
 * Misc. helper functions
 */

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


async function generateGameModeConfig( data: any ) {
  // generate file
  const gmfile = path.join( steampath, CSGO_BASEDIR, CSGO_GAMEMODES_FILE );
  const gmfiletpl = await fs.promises.readFile(
    path.join( __dirname, `resources/${CSGO_GAMEMODES_FILE}` ),
    'utf8'
  );

  return fs.promises.writeFile( gmfile, Sqrl.render( gmfiletpl, data ) );
}


async function generateServerConfig( data: any ) {
  // generate config file
  const targetcfg = path.join( steampath, CSGO_BASEDIR, CSGO_CFGDIR, CSGO_SERVER_CONFIG_FILE );
  const configtpl = await fs.promises.readFile(
    path.join( __dirname, `resources/${CSGO_SERVER_CONFIG_FILE}` ),
    'utf8'
  );

  return fs.promises.writeFile( targetcfg, Sqrl.render( configtpl, data ) );
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


async function generateBotConfig( squad1: Models.Player[], squad2: Models.Player[] ) {
  // create a backup
  const botcfg = path.join( steampath, CSGO_BASEDIR, BOT_CONFIG );
  const backupcfg = path.join( steampath, CSGO_BASEDIR, BOT_CONFIG_BACKUP );

  if( !fs.existsSync( backupcfg ) ) {
    fs.copyFileSync( botcfg, backupcfg );
  }

  // load up our bot config and write
  // the bot profiles to disk
  const configtpl = await fs.promises.readFile(
    path.join( __dirname, 'resources', BOT_CONFIG ),
    'utf8'
  );

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
  //
  // create a backup
  const scbfile = path.join( steampath, CSGO_BASEDIR, CSGO_RESOURCEDIR, CSGO_LANGUAGE_FILE );
  const scbfile_backup = path.join( steampath, CSGO_BASEDIR, CSGO_RESOURCEDIR, CSGO_LANGUAGE_FILE_BACKUP );

  if( !fs.existsSync( scbfile_backup ) ) {
    fs.copyFileSync( scbfile, scbfile_backup );
  }

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


function restoreBotConfig() {
  const botcfg = path.join( steampath, CSGO_BASEDIR, BOT_CONFIG );
  const backupcfg = path.join( steampath, CSGO_BASEDIR, BOT_CONFIG_BACKUP );

  // restore the backup file
  if( fs.existsSync( backupcfg ) ) {
    fs.copyFileSync( backupcfg, botcfg );
  }
}


function restoreScoreboardFile() {
  const scbfile = path.join( steampath, CSGO_BASEDIR, CSGO_RESOURCEDIR, CSGO_LANGUAGE_FILE );
  const scbfile_backup = path.join( steampath, CSGO_BASEDIR, CSGO_RESOURCEDIR, CSGO_LANGUAGE_FILE_BACKUP );

  if( fs.existsSync( scbfile_backup ) ) {
    fs.copyFileSync( scbfile_backup, scbfile );
  }
}


function cleanup() {
  log.info( 'connection closed to gameserver. cleaning up...' );

  // clean up connections to processes and/or files
  gameproc.kill();
  scorebot.unwatch();

  // restore modified config files
  restoreBotConfig();
  restoreScoreboardFile();

  // clean up the log file
  fs.unlinkSync( path.join( steampath, CSGO_BASEDIR, CSGO_LOGFILE ) );
}


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


/**
 * IPC handlers
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

  // load user's profile and the competition object
  const profile = await Models.Profile.getActiveProfile();
  const competition = profile.Team.Competitions.find( c => c.id === request.params.compId );
  const queue = await Models.ActionQueue.findByPk( request.params.quid );
  const [ isleague, iscup ] = parseCompType( competition.Comptype.name );

  // these will be used later when launching/closing the game
  let compobj: League | Cup;
  let hostname_suffix: string;
  let match: Match;
  let allow_ot: boolean;
  let team1: Models.Team;
  let team2: Models.Team;
  let tourneyobj: Tournament;

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
      const [ conf ] = divobj.getCompetitorPromotionConferenceAndSeedNumById( profile.Team.id );
      allow_ot = true;
      tourneyobj = conf.duelObj;
      match = conf.duelObj.findMatch( request.params.matchId );
      team1 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, match.p[ 0 ] ).name );
      team2 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, match.p[ 1 ] ).name );
    } else {
      const [ conf ] = divobj.getCompetitorConferenceAndSeedNumById( profile.Team.id );
      allow_ot = false;
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
    tourneyobj.score( match.id, Worldgen.Score( team1, team2 ) );
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

    await competition.save();
    await queue.update({ completed: true });
    return evt.sender.send( request.responsechannel );
  }

  // --------------------------------
  // SET UP CSGO CONFIG FILES
  // --------------------------------

  // generate the gamemodes text file
  await generateGameModeConfig({
    server_config_file: CSGO_SERVER_CONFIG_FILE
  });

  // generate server config
  await generateServerConfig({
    demo: Application.DEMO_MODE,
    hostname: `${compobj.name}: ${competition.Continent.name} — ${hostname_suffix}`,
    logfile: CSGO_LOGFILE,
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
  await generateScoreboardFile();

  // --------------------------------
  // CSGO + RCON SET UP
  // --------------------------------

  // launch csgo
  launchCSGO( match.data.map );

  // connect to rcon
  rcon = await initrcon();

  // restore default config files once the rcon connection is closed
  rcon.on( 'end', cleanup );

  // --------------------------------
  // BOT SET UP
  // --------------------------------

  // add this match's bots
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
  scorebot = new Scorebot.Scorebot( path.join( steampath, CSGO_BASEDIR, CSGO_LOGFILE ) );

  scorebot.on( Scorebot.GameEvents.SAY, async ( text: string ) => {
    switch( text ) {
      case '.ready':
        await rcon.send( 'mp_warmup_end' );
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

    await competition.save();
    await queue.update({ completed: true });
    evt.sender.send( request.responsechannel );
  });
}


export default function() {
  ipcMain.on( IPCRouting.Competition.PLAY, play );
}
