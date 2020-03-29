interface NeDBRecord {
  _id: string;    // inherited from NeDB
}


export interface Userdata extends NeDBRecord {
  teamid: string;
  playerid: string;
}


export interface Continent extends NeDBRecord {
  code: string;
  name: string;
  countries: Country[];
}


export interface Country {
  name: string;
  emoji: string;
}


export interface Team extends NeDBRecord {
  region: number;
  tier: number;
  name: string;
  countrycode: string;
  players: Player[];
  logo?: string;
  url?: string;
  tag?: string;
}


export interface Player extends NeDBRecord {
  alias: string;
  countrycode: string;
  tier: number;
  teamid: string;
  name?: string;
  url?: string;
  countryurl?: string;
}


export interface Compdef extends NeDBRecord {
  id: string;
  name: string;
  regions: string[];
  season: number;
  tiers: number | Tier[];
}


export interface Tier {
  name: string;
  minlen: number;
  confsize: number;
}
