import os from 'os';
import path from 'path';
import fs from 'fs';
import is from 'electron-is';
import log from 'electron-log';
import dedent from 'dedent';
import getLocalIP from 'main/lib/local-ip';
import Scorebot from 'main/lib/scorebot';

import * as Sqrl from 'squirrelly';
import * as Models from 'main/database/models';

import { random } from 'lodash';
import { ping } from '@network-utils/tcp-ping';
import { Rcon } from 'rcon-client';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { League } from 'main/lib/league';


// constants
const CSGO_APPID = 730;
const CSGO_BASEDIR = 'steamapps/common/Counter-Strike Global Offensive/csgo';
const CSGO_BOTCONFIG = 'botprofile.db';
const CSGO_BOTCONFIG_BACKUP = 'botprofile.original.db';
const CSGO_BOT_VOICEPITCH_MIN = 80;
const CSGO_BOT_VOICEPITCH_MAX = 125;
const CSGO_CFGDIR = 'cfg';
const CSGO_LANGUAGE_FILE = 'csgo_english.txt';
const CSGO_LANGUAGE_FILE_BACKUP = 'csgo_english.original.txt';
const CSGO_LOGFILE = 'logs/liga.log';
const CSGO_RESOURCEDIR = 'resource';

const RCON_MAX_ATTEMPTS = 15;
const RCON_PASSWORD = 'liga';
const RCON_PORT = 27015;

const SQUAD_STARTERS_NUM = 5;

const TIER_TO_BOT_DIFFICULTY_MAP = [
  {
    difficulty: 3,
    templates: [ 'Expert', 'Elite' ]
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
    templates: [ 'Easy' ]
  }
];


// variables
let steampath: string;
let gameproc: ChildProcessWithoutNullStreams;


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
      log.info( error );
    }
  }

  // if we got this far, we couldn't connect, give up.
  return Promise.reject( 'Could not connect to gameserver.' );
}


/**
 * Misc. helper functions
 */

function generateSquads( team1: Models.Player[], team2: Models.Player[] ) {
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


async function generateServerConfig( data: any ) {
  // generate config file
  const targetcfg = path.join( steampath, CSGO_BASEDIR, CSGO_CFGDIR, 'liga.cfg' );
  const configtpl = await fs.promises.readFile(
    path.join( __dirname, 'resources/liga.cfg' ),
    'utf8'
  );

  return fs.promises.writeFile( targetcfg, Sqrl.render( configtpl, data ) );
}


function generateBotSkill( p: Models.Player ) {
  const difficulty = TIER_TO_BOT_DIFFICULTY_MAP[ p.tier ];
  const templateidx = random( 0, difficulty.templates.length - 1 );

  return dedent`
    ${difficulty.templates[ templateidx ]} ${p.alias}
      VoicePitch = ${random( CSGO_BOT_VOICEPITCH_MIN, CSGO_BOT_VOICEPITCH_MAX )}
    End\n
  `;
}


async function generateBotConfig( squad1: Models.Player[], squad2: Models.Player[] ) {
  // create a backup
  const botcfg = path.join( steampath, CSGO_BASEDIR, CSGO_BOTCONFIG );
  const backupcfg = path.join( steampath, CSGO_BASEDIR, CSGO_BOTCONFIG_BACKUP );

  if( !fs.existsSync( backupcfg ) ) {
    fs.copyFileSync( botcfg, backupcfg );
  }

  // load up our bot config and write
  // the bot profiles to disk
  const configtpl = await fs.promises.readFile(
    path.join( __dirname, 'resources', CSGO_BOTCONFIG ),
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


async function patchScoreboardFile() {
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
  return fs.promises.writeFile( scbfile, content.replace( '"BOT %s1', '"%s1' ), 'utf16le' );
}


function launchCSGO() {
  if( is.osx() ) {
    gameproc = spawn(
      'open',
      [ `steam://rungameid/${CSGO_APPID}//'+exec liga +map de_dust2 -usercon'` ],
      { shell: true }
    );
  } else {
    gameproc = spawn(
      'steam.exe',
      [
        '-applaunch', CSGO_APPID.toString(),
        '+exec', 'liga',
        '+map', 'de_dust',
        '-usercon'
      ],
      { cwd: steampath }
    );
  }
}


/**
 * IPC handlers
 */

async function play( evt: IpcMainEvent, request: IpcRequest<{ id: number }> ) {
  // --------------------------------
  // SET UP VARS
  // --------------------------------

  // load user's profile and their league division
  const profile = await Models.Profile.getActiveProfile();
  const compobj = profile.Team.Competitions.find( c => c.id === request.params.id );
  const leagueobj = League.restore( compobj.data );
  const divobj = leagueobj.getDivisionByCompetitorId( profile.Team.id );

  // grab their next match information
  const [ conf, seednum ] = divobj.getCompetitorConferenceAndSeedNumById( profile.Team.id );
  const [ match ] = conf.groupObj.upcoming( seednum );
  const [ seed1, seed2 ] = match.p;

  // grab the team information for this match
  const team1 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, seed1 ).name );
  const team2 = await Models.Team.findByName( divobj.getCompetitorBySeed( conf, seed2 ).name );

  // generate each team's squads
  const [ squad1, squad2 ] = generateSquads(
    team1.Players.filter( p => p.alias !== profile.Player.alias ),
    team2.Players.filter( p => p.alias !== profile.Player.alias )
  );

  // --------------------------------
  // SET UP CSGO CONFIG FILES
  // --------------------------------

  // generate server config
  await generateServerConfig({
    hostname: `${leagueobj.name}: ${compobj.Continents[ 0 ].name} — ${divobj.name}`,
    rcon_password: RCON_PASSWORD,
    teamname1: team1.name,
    teamname2: team2.name,
    logfile: CSGO_LOGFILE
  });

  // generate bot config
  await generateBotConfig( squad1, squad2 );

  // remove bot prefixes from scoreboard
  await patchScoreboardFile();

  // --------------------------------
  // CSGO + RCON SET UP
  // --------------------------------

  // launch csgo
  launchCSGO();

  // connect to rcon
  const rcon = await initrcon();

  // csgo process event handlers
  gameproc.on( 'error', () => evt.sender.send( request.responsechannel ) );
  gameproc.on( 'close', () => evt.sender.send( request.responsechannel ) );

  // --------------------------------
  // BOT SET UP
  // --------------------------------

  // once server is ready, start adding bots
  //
  // add team1 bots
  await rcon.send( `bot_difficulty ${TIER_TO_BOT_DIFFICULTY_MAP[ team1.tier ].difficulty}` );
  await rcon.send( team1.Players.map( p => p.alias ).join( ';' ) );

  // add team2 bots
  await rcon.send( `bot_difficulty ${TIER_TO_BOT_DIFFICULTY_MAP[ team2.tier ].difficulty}` );
  await rcon.send( team2.Players.map( p => p.alias ).join( ';' ) );

  // --------------------------------
  // SCOREBOT SET UP + EVENT HANDLERS
  // --------------------------------

  // start watching log file
  // @todo: clear liga.log first
  const sb = new Scorebot.Scorebot( path.join( steampath, CSGO_BASEDIR, CSGO_LOGFILE ) );

  sb.on( Scorebot.GameEvents.SAY, async ( text: string ) => {
    switch( text ) {
      case '.ready':
        await rcon.send( 'mp_warmup_end' );
        break;
      default:
        break;
    }
  });
}


export default () => {
  ipcMain.on( '/game/play', play );
};
