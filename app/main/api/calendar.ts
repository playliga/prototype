import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import * as IPCRouting from 'shared/ipc-routing';
import Worldgen from 'main/lib/worldgen';


interface LoopParams {
  max?: number;
}


async function handler( evt: IpcMainEvent, request: IpcRequest<LoopParams> ) {
  // bail if no response channel provided
  if( !request.responsechannel ) {
    return;
  }

  // begin the calendar loop
  await Worldgen.Calendar.loop( request.params?.max );
  evt.sender.send( request.responsechannel, null );
}


export default function() {
  ipcMain.on( IPCRouting.Worldgen.CALENDAR_LOOP, handler );
}
