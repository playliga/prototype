import os from 'os';
import path from 'path';
import fs from 'fs';
import is from 'electron-is';
import log from 'electron-log';
import getLocalIP from 'main/lib/local-ip';

import { ping } from '@network-utils/tcp-ping';
import { Rcon } from 'rcon-client';
import { spawn } from 'child_process';
import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';


// constants
const CSGO_APPID = 730;
const CSGO_BASEDIR = 'steamapps/common/Counter-Strike Global Offensive';
const CSGO_CFGDIR = 'csgo/cfg';

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

      return Promise.resolve( rcon );
    } catch( error ) {
      log.info( error );
    }
  }

  // if we got this far, we couldn't connect, give up.
  return Promise.reject( 'Could not connect to gameserver.' );
}


/**
 * IPC handlers
 */

async function start( evt: IpcMainEvent, request: IpcRequest<any> ) {
  // copy liga.cfg over to proper folder
  // @todo: overwrite when copying
  const sourcecfg = path.join( __dirname, 'resources/liga.cfg' );
  const targetcfg = path.join( steampath, CSGO_BASEDIR, CSGO_CFGDIR, 'liga.cfg' );

  if( fs.existsSync( sourcecfg ) ) {
    fs.copyFileSync( sourcecfg, targetcfg );
  }

  // launch csgo
  // @todo: support windows
  if( is.osx() ) {
    gameproc = spawn(
      'open',
      [ `steam://rungameid/${CSGO_APPID}//'+exec liga +map de_dust2 -usercon'` ],
      { shell: true }
    );
  } else {
    gameproc = spawn(
      'steam.exe',
      [ `steam://rungameid/${CSGO_APPID}//'+exec liga +map de_dust2 -usercon'` ],
      { cwd: steampath }
    );
  }

  // handlers
  gameproc.on( 'error', () => evt.sender.send( request.responsechannel ) );
  gameproc.on( 'close', () => evt.sender.send( request.responsechannel ) );

  const rcon = await initrcon();
  rcon.send( 'say hello n00bs' )
    .then(log.info)
    .catch(log.error)
  ;
}


export default () => {
  ipcMain.on( '/game/start', start );
};
