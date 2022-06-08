import is from 'electron-is';
import { app, ipcMain, IpcMainEvent } from 'electron';
import { version, productName } from 'package.json';
import { IpcRequest } from 'shared/types';
import * as IPCRouting from 'shared/ipc-routing';


type AppInfoParams = null;


async function appInfoHandler( evt: IpcMainEvent, request: IpcRequest<AppInfoParams> ) {
  evt.sender.send( request.responsechannel, JSON.stringify({
    name: is.production() ? app.getName(): productName,
    version: is.production() ? app.getVersion() : version
  }));
}


export default function() {
  ipcMain.on( IPCRouting.Common.APP_INFO, appInfoHandler );
}
