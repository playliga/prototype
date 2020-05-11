export const FINDALL = 'email.findall';
export const FINDALL_FINISH = 'email.findall.finish';
export const ADD_FINISH = 'email.add.finish';
export const UPDATE = 'email.update';
export const UPDATE_FINISH = 'email.update.finish';


export interface Email {
  id: number;
  subject: string;
  content: string;
  read: boolean;
  Persona: any;
}


interface FindAllEmailAction {
  type: typeof FINDALL;
}


interface FindAllFinishEmailAction {
  type: typeof FINDALL_FINISH;
  payload: Email[];
}


interface AddEmailFinishAction {
  type: typeof ADD_FINISH;
  payload: Email;
}


interface UpdateEmailAction {
  type: typeof UPDATE;
  payload: Email;
}


interface UpdateEmailFinishAction {
  type: typeof UPDATE_FINISH;
  payload: Email;
}


export type EmailActionTypes =
  | FindAllEmailAction
  | FindAllFinishEmailAction
  | AddEmailFinishAction
  | UpdateEmailAction
  | UpdateEmailFinishAction
;


export interface EmailState {
  loading: boolean;
  data: Email[];
}
