export const CALENDAR_START = 'profile.calendar.start';
export const CALENDAR_FINISH = 'profile.calendar.finish';
export const FIND = 'profile.find';
export const FIND_FINISH = 'profile.find.finish';
export const TRAINSQUAD = 'profile.trainsquad';
export const UPDATE_SQUAD_MEMBER = 'profile.updatesqdm';
export const UPDATE_SQUAD_MEMBER_FINISH = 'profile.updatesqdm.finish';
export const UPDATE_SETTINGS = 'profile.updatesettings';
export const FORCE_REFRESH = 'profile.forcerefresh';


export interface Profile {
  id: number;
  currentDate: string;
  settings: any;
  trainedAt: string;
  Player: any;
  Team: any;
}


interface CalendarStartAction {
  type: typeof CALENDAR_START;
}


interface CalendarFinishAction {
  type: typeof CALENDAR_FINISH;
}


interface FindProfileAction {
  type: typeof FIND;
}


interface ForceRefreshAction {
  type: typeof FORCE_REFRESH;
}


interface TrainSquadProfileAction {
  type: typeof TRAINSQUAD;
  payload: number[];
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
  | CalendarStartAction
  | CalendarFinishAction
  | FindProfileAction
  | FindProfileFinishAction
  | ForceRefreshAction
  | TrainSquadProfileAction
  | UpdateSquadMemberAction
  | UpdateSquadMemberFinishAction
  | UpdateSettingsAction
;


export interface ProfileState {
  loading: boolean;
  calendarRunning: boolean;
  forceRefresh: boolean;
  data: Profile | null;
}
