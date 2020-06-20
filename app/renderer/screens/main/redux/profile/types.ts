export const FIND = 'profile.find';
export const FIND_FINISH = 'profile.find.finish';


export interface Profile {
  id: number;
  currentDate: moment.Moment;
}


interface FindProfileAction {
  type: typeof FIND;
}


interface FindProfileFinishAction {
  type: typeof FIND_FINISH;
  payload: Profile;
}


export type ProfileActionTypes =
  | FindProfileAction
  | FindProfileFinishAction
;


export interface ProfileState {
  loading: boolean;
  data: Profile;
}
