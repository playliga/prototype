export const FIND = 'squad.find';
export const FIND_FINISH = 'squad.find.finish';
export const UPDATE = 'squad.update';
export const UPDATE_FINISH = 'squad.update.finish';


export interface Squad {
  [x: string]: any;         // @todo
}


interface FindSquadAction {
  type: typeof FIND;
  payload: number;
}


interface FindSquadFinishAction {
  type: typeof FIND_FINISH;
  payload: Squad;
}


interface UpdateAction {
  type: typeof UPDATE;
  payload: any;             // @todo: is a player
}


interface UpdateFinishAction {
  type: typeof UPDATE_FINISH;
  payload: any;             // @todo: is a player
}


export type SquadActionTypes =
  | FindSquadAction
  | FindSquadFinishAction
  | UpdateAction
  | UpdateFinishAction
;


export interface SquadState {
  loading: boolean;
  data: Squad | null;
}
