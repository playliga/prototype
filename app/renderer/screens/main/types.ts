import { EmailState } from 'renderer/screens/main/redux/emails/types';
import { ProfileState } from 'renderer/screens/main/redux/profile/types';


export interface ApplicationState {
  emails: EmailState;
  profile: ProfileState;
}


export interface RouteConfig {
  id: string;
  path: string;
  title: string;
  component?: any;
  icon?: any;
  subroutes?: RouteConfig[];
  notifications?: number;
}


export interface NextMatchResponse {
  competition: string;
  competitionId: number;
  confId: string;
  division: string;
  region: string;
  match: any;
}


export interface StandingsResponse {
  competition: string;
  competitionId: number;
  division: string;
  isOpen: boolean;
  region: string;
  regionId: number;
  standings: any[];
}
