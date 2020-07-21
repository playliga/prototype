import Competitor from './competitor';


export interface Result {
  pos: number;
  seed: number;
}


export interface Tournament {
  resultsFor: Function;
  isDone: Function;
  results: () => Result[];
  matches: Array<{ id: string }>;
  unscorable: Function;
  score: Function;
  state: any[];
  standings?: Result[];
}


export interface Conference {
  id: string;
  competitors: Competitor[];
  groupObj: Tournament;
}


export interface PromotionConference {
  id: string;
  competitors: Competitor[];
  duelObj: Tournament;
}
