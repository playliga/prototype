import * as SquadTypes from './types';


export function find( teamId: number ): SquadTypes.SquadActionTypes {
  return {
    type: SquadTypes.FIND,
    payload: teamId
  };
}


export function findFinish( payload: SquadTypes.Squad ): SquadTypes.SquadActionTypes {
  return {
    type: SquadTypes.FIND_FINISH,
    payload
  };
}


export function toggleStarter( payload: any ) {
  return {
    type: SquadTypes.TOGGLESTARTER,
    payload
  };
}


export function toggleStarterFinish( payload: any ): SquadTypes.SquadActionTypes {
  return {
    type: SquadTypes.TOGGLESTARTER_FINISH,
    payload
  };
}
