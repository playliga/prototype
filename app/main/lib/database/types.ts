export interface Country {
  name: string;
  emoji: string;
}


export interface Continent {
  code: string;
  name: string;
  countries: Country[];
}


export interface Team {
  _id: string;              // inherited from nedb
  id: string;               // inherited from scraper
  name: string;
  logo?: string;
  countrycode: string;
  url: string;
  players: Player[];
  tag?: string;
}


export interface Player {
  id: string;
  url: string;
  name: string;
  countryurl: string;
  countrycode: string;
}
