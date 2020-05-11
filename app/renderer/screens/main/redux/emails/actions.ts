import { ipcRenderer } from 'electron';
import * as EmailTypes from './types';


export function findAll(): EmailTypes.EmailActionTypes {
  return {
    type: EmailTypes.FINDALL
  };
}


export function findAllFinish( payload: EmailTypes.Email[] ): EmailTypes.EmailActionTypes {
  return {
    type: EmailTypes.FINDALL_FINISH,
    payload
  };
}


export function addEmail( payload: EmailTypes.Email ): EmailTypes.EmailActionTypes {
  return {
    type: EmailTypes.ADD_FINISH,
    payload
  };
}


export function register() {
  return ( dispatch: Function ) => {
    ipcRenderer.on( '/worldgen/email/new', ( evt, email ) => {
      dispatch( addEmail( JSON.parse( email ) ) );
    });
  };
}


export function update( payload: EmailTypes.Email ): EmailTypes.EmailActionTypes {
  return {
    type: EmailTypes.UPDATE,
    payload
  };
}


export function updateFinish( payload: EmailTypes.Email ) {
  return {
    type: EmailTypes.UPDATE_FINISH,
    payload
  };
}
