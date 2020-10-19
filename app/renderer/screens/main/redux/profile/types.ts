export const CALENDAR_FINISH = 'profile.calendar.finish';
export const FIND = 'profile.find';
export const FIND_FINISH = 'profile.find.finish';
export const UPDATE_SQUAD_MEMBER = 'profile.updatesqdm';
export const UPDATE_SQUAD_MEMBER_FINISH = 'profile.updatesqdm.finish';
export const UPDATE_SETTINGS = 'profile.updatesettings';


export interface Profile {
  id: number;
  currentDate: string;
  settings: any;
  Player: any;
  Team: any;
}


interface CalendarFinishAction {
  type: typeof CALENDAR_FINISH;
}


interface FindProfileAction {
  type: typeof FIND;
}


interface FindProfileFinishAction {
  type: typeof FIND_FINISH;
  payload: Profile;
}


interface UpdateSquadMemberAction {
  type: typeof UPDATE_SQUAD_MEMBER;
  payload: any;             // @todo: is a player
}


interface UpdateSquadMemberFinishAction {
  type: typeof UPDATE_SQUAD_MEMBER_FINISH;
  payload: any;             // @todo: is a player
}


interface UpdateSettingsAction {
  type: typeof UPDATE_SETTINGS;
  payload: any;             // @todo: is a player
}


export type ProfileActionTypes =
  | CalendarFinishAction
  | FindProfileAction
  | FindProfileFinishAction
  | UpdateSquadMemberAction
  | UpdateSquadMemberFinishAction
  | UpdateSettingsAction
;


export interface ProfileState {
  loading: boolean;
  data: Profile | null;
}
