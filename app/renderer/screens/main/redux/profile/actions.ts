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


export function trainSquad( payload: any ): ProfileTypes.ProfileActionTypes {
  return {
    type: ProfileTypes.TRAINSQUAD,
    payload
  };
}


export function updateSquadMember( payload: any ): ProfileTypes.ProfileActionTypes {
  return {
    type: ProfileTypes.UPDATE_SQUAD_MEMBER,
    payload
  };
}


export function updateSquadMemberFinish( payload: any ): ProfileTypes.ProfileActionTypes {
  return {
    type: ProfileTypes.UPDATE_SQUAD_MEMBER_FINISH,
    payload
  };
}


export function updateSettings( payload: any ): ProfileTypes.ProfileActionTypes {
  return {
    type: ProfileTypes.UPDATE_SETTINGS,
    payload
  };
}


export function calendarStart(): ProfileTypes.ProfileActionTypes {
  return {
    type: ProfileTypes.CALENDAR_START
  };
}


export function calendarFinish(): ProfileTypes.ProfileActionTypes {
  return {
    type: ProfileTypes.CALENDAR_FINISH
  };
}


export function forceRefreshToggle(): ProfileTypes.ProfileActionTypes {
  return {
    type: ProfileTypes.FORCE_REFRESH
  };
}


export function register() {
  return ( dispatch: Function ) => {
    ipcRenderer.on( IPCRouting.Database.PROFILE_GET, ( evt, data ) => {
      dispatch( findFinish( JSON.parse( data ) ) );
    });

    ipcRenderer.on( IPCRouting.Competition.MATCHES_NEW, () => {
      dispatch( forceRefreshToggle() );
    });
  };
}
