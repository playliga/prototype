import os from 'os';
import path from 'path';
import fs from 'fs';
import is from 'electron-is';
import log from 'electron-log';
import getLocalIP from 'main/lib/local-ip';
import Scorebot from 'main/lib/scorebot';

import * as Sqrl from 'squirrelly';
import * as Models from 'main/database/models';

import { ping } from '@network-utils/tcp-ping';
import { Rcon } from 'rcon-client';
import { spawn } from 'child_process';
import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { League } from 'main/lib/league';


// constants
const CSGO_APPID = 730;
const CSGO_BASEDIR = 'steamapps/common/Counter-Strike Global Offensive/csgo';
const CSGO_CFGDIR = 'cfg';
const CSGO_LOGFILE = 'logs/liga.log';

const RCON_MAX_ATTEMPTS = 15;
const RCON_PASSWORD = 'liga';
const RCON_PORT = 27015;


// variables
let steampath: string;
let gameproc;


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

function generateServerConfig( data: any ) {
  // generate config file
  const targetcfg = path.join( steampath, CSGO_BASEDIR, CSGO_CFGDIR, 'liga.cfg' );
  const configtpl = fs.readFileSync(
    path.join( __dirname, 'resources/liga.cfg' ),
    'utf-8'
  );

  fs.writeFileSync( targetcfg, Sqrl.render( configtpl, data ) );
}


/**
 * IPC handlers
 */

async function play( evt: IpcMainEvent, request: IpcRequest<{ id: number }> ) {
  // load user's profile and their league division
  const profile = await Models.Profile.getActiveProfile();
  const compobj = profile.Team.Competitions.find( c => c.id === request.params.id );
  const leagueobj = League.restore( compobj.data );
  const divobj = leagueobj.getDivisionByCompetitorId( profile.Team.id );

  // grab their next match information
  const [ conf, seednum ] = divobj.getCompetitorConferenceAndSeedNumById( profile.Team.id );
  const [ match ] = conf.groupObj.upcoming( seednum );
  const [ seed1, seed2 ] = match.p;

  // generate config file
  generateServerConfig({
    hostname: `${leagueobj.name}: ${compobj.Continents[ 0 ].name} — ${divobj.name}`,
    rcon_password: RCON_PASSWORD,
    teamname1: divobj.getCompetitorBySeed( conf, seed1 ).name,
    teamname2: divobj.getCompetitorBySeed( conf, seed2 ).name,
    logfile: path.join( steampath, CSGO_BASEDIR, CSGO_LOGFILE )
  });

  // launch csgo
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

  // handlers
  gameproc.on( 'error', () => evt.sender.send( request.responsechannel ) );
  gameproc.on( 'close', () => evt.sender.send( request.responsechannel ) );

  // connect to rcon
  const rcon = await initrcon();

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
