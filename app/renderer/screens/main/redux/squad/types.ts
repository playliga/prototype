export const FIND = 'squad.find';
export const FIND_FINISH = 'squad.find.finish';
export const TOGGLESTARTER = 'squad.togglestarter';
export const TOGGLESTARTER_FINISH = 'squad.togglestarter.finish';


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


interface ToggleStarterAction {
  type: typeof TOGGLESTARTER;
  payload: any;             // @todo: is a player
}


interface ToggleStarterFinishAction {
  type: typeof TOGGLESTARTER_FINISH;
  payload: any;             // @todo: is a player
}


export type SquadActionTypes =
  | FindSquadAction
  | FindSquadFinishAction
  | ToggleStarterAction
  | ToggleStarterFinishAction
;


export interface SquadState {
  loading: boolean;
  data: Squad | null;
}
