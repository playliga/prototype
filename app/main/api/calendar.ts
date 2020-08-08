import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import * as IPCRouting from 'shared/ipc-routing';
import * as Worldgen from 'main/lib/worldgen';


async function handler( evt: IpcMainEvent, request: IpcRequest<null> ) {
  // bail if no response channel provided
  if( !request.responsechannel ) {
    return;
  }

  // begin the calendar loop
  await Worldgen.calendarLoop();
  evt.sender.send( request.responsechannel, null );
}


export default function() {
  ipcMain.on( IPCRouting.Worldgen.CALENDAR_LOOP, handler );
}
