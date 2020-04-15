import { ipcRenderer } from 'electron';
import { IpcRequest } from 'shared/types';


export default class IpcService {
  public static send( channel: string, request: IpcRequest<any> ): Promise<any> {
    // if there's no response channel let's auto-generate it
    if( !request.responsechannel ) {
      request.responsechannel = `${channel}/response_${new Date().getTime()}`;
    }

    // send the request
    ipcRenderer.send(channel, request);

    // and resolve the promise once we get a response
    return new Promise( resolve => {
      ipcRenderer.once(
        request.responsechannel as string,
        ( evt, response ) => resolve( JSON.parse( response ) )
      );
    });
  }
}
