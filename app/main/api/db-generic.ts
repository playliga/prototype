import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import * as Models from 'main/database/models';


interface IpcRequestParams {
  model: string;
  method: string;
  args?: any;
}


async function handler( evt: IpcMainEvent, request: IpcRequest<IpcRequestParams> ) {
  // bail if no params or response channel provided
  if( !request.params || !request.responsechannel ) {
    return;
  }

  // bail if model or method are not defined
  const { model, method, args } = request.params;

  if( !model || !method ) {
    return;
  }

  // dynamically call the model function
  const data = await (Models as any)[ model ][ method ]( args );
  evt.sender.send( request.responsechannel, JSON.stringify( data ) );
}


export default () => {
  ipcMain.on( '/database/', handler );
};
