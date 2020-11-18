import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { Profile } from 'main/database/models';
import * as IPCRouting from 'shared/ipc-routing';


interface IpcRequestParams {
  id: number;
}


async function get( evt: IpcMainEvent, request: IpcRequest<IpcRequestParams> ) {
  // bail if no response channel provided
  if( !request.responsechannel ) {
    return;
  }

  // get the profile and return to the renderer
  const data = await Profile.getActiveProfile();
  evt.sender.send( request.responsechannel, JSON.stringify( data ) );
}


async function getsquad( evt: IpcMainEvent, request: IpcRequest<null> ) {
  const profile = await Profile.getActiveProfile();
  const squad = profile
    .Team
    .Players
    .filter( p => p.id !== profile.Player.id )
  ;
  evt.sender.send( request.responsechannel, JSON.stringify( squad ) );
}


export default function() {
  ipcMain.on( IPCRouting.Database.PROFILE_GET, get );
  ipcMain.on( IPCRouting.Database.PROFILE_SQUAD, getsquad );
}
