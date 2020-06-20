import { ipcRenderer } from 'electron';
import * as IPCRouting from 'shared/ipc-routing';
import * as ProfileTypes from './types';


export function find(): ProfileTypes.ProfileActionTypes {
  return {
    type: ProfileTypes.FIND
  };
}


export function findFinish( payload: ProfileTypes.Profile ): ProfileTypes.ProfileActionTypes {
  return {
    type: ProfileTypes.FIND_FINISH,
    payload
  };
}


export function register() {
  return ( dispatch: Function ) => {
    ipcRenderer.on( IPCRouting.Database.PROFILE_GET, ( evt, data ) => {
      dispatch( findFinish( JSON.parse( data ) ) );
    });
  };
}
