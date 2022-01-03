import { EmailState } from 'renderer/screens/main/redux/emails/types';
import { ProfileState } from 'renderer/screens/main/redux/profile/types';


export interface ApplicationState {
  emails: EmailState;
  profile: ProfileState;
}


export interface RouteConfig {
  id: string;
  path: string;
  title?: string;
  component?: any;
  icon?: any;
  subroutes?: RouteConfig[];
  notifications?: number | boolean;
  sidebar?: boolean;
  exact?: boolean;
}


export interface UpcomingMatchResponse {
  quid: number;
  competition: string;
  competitionId: number;
  confId?: string;
  date: string;
  division?: string;
  postseason?: string;
  region: string;
  match: any;
  type: string[];
}


export interface StandingsResponse {
  competition: string;
  competitionId: number;
  division?: string;
  isOpen: boolean;
  region: string;
  regioncode: string;
  regionId: number;
  stageName?: string;
  standings?: any[];
  round?: any[];
  type: string[];
}
