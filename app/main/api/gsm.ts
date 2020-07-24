import os from 'os';
import path from 'path';
import fs from 'fs';
import is from 'electron-is';
import { spawn } from 'child_process';
import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';


const CSGO_APPID = 730;
const CSGO_BASEDIR = 'Steam/steamapps/common/Counter-Strike Global Offensive';
const CSGO_CFGDIR = 'csgo/cfg';


let steampath: string;
let gameproc;


if( is.osx() ) {
  steampath = `${os.homedir()}/Library/Application Support`;
} else {
  steampath = 'windowspathhere';
}


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
  // @todo: detached mode? will allow parent (laliga) to close w/o closing csgo
  gameproc = spawn(
    'open',
    [ `steam://rungameid/${CSGO_APPID}//'+exec liga +map de_dust2'` ],
    { shell: true }
  );

  // handlers
  gameproc.on( 'error', () => evt.sender.send( request.responsechannel ) );
  gameproc.on( 'close', () => evt.sender.send( request.responsechannel ) );
}


export default () => {
  ipcMain.on( '/game/start', start );
};
