import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import * as IPCRouting from 'shared/ipc-routing';
import { Competition } from 'main/database/models';
import { League } from 'main/lib/league';


interface IpcRequestParams {
  id: number;
}


async function start( evt: IpcMainEvent, request: IpcRequest<IpcRequestParams> ) {
  // bail if no params or response channel provided
  if( !request.params || !request.responsechannel ) {
    return;
  }

  // load the competition from the db
  const { id } = request.params;
  const comp = await Competition.findByPk( id );

  if( !comp ) {
    return;
  }

  // restore league object and start it
  const league = League.restore( comp.data );
  league.start();

  // replace the old data with the new league object
  const data = await comp.update({ data: league });
  evt.sender.send( request.responsechannel, JSON.stringify( data ) );
}


export default () => {
  ipcMain.on( IPCRouting.Database.COMPETITION_START, start );
};
