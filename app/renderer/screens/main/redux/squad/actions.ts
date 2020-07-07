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


export function update( payload: any ) {
  return {
    type: SquadTypes.UPDATE,
    payload
  };
}


export function updateFinish( payload: any ): SquadTypes.SquadActionTypes {
  return {
    type: SquadTypes.UPDATE_FINISH,
    payload
  };
}
