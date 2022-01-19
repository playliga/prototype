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
  stageName?: string;
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
  rounds?: any[];
}


export interface BaseCompetition {
  id: number;
  name: string;
  region: string;
  regioncode: string;
  regionId: string;
  started: boolean;
  isOpen: boolean;
}


export interface LeagueDivisionResponse {
  name: string;
  conferences: StandingsResponse[];
}


export interface GlobalCircuitStageResponse {
  stageName: string;
  standings?: StandingsResponse[];
  rounds: any[];
}


export interface LeagueResponse extends BaseCompetition {
  divisions: LeagueDivisionResponse[];
}


export interface CupResponse extends BaseCompetition {
  data: any[];
}


export interface GlobalCircuitResponse extends BaseCompetition {
  stages: GlobalCircuitStageResponse[];
}


export interface CompTypeResponse {
  id: number;
  name: string;
  Competitions: any[];
}
