export interface Country {
  name: string;
  emoji: string;
}


export interface Continent {
  code: string;
  name: string;
  countries: Country[];
}
