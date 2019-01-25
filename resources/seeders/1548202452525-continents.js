// @flow
import { continents, countries } from 'countries-list';


function continentFormatter( continentCode: string ) {
  // collect countries for current continent
  const continentCountries = Object.keys( countries )
    .map( ( countryCode: string ) => countries[ countryCode ] )
    .filter( ( country: Object ) => country.continent === continentCode );

  // return object with continent and country data
  return {
    code: continentCode,
    name: continents[ continentCode ],
    countries: continentCountries
  };
}


export default class Seeder {
  static up( docs: Object, Database: Object ) {
    const data = Object.keys( continents ).map( continentFormatter );
    return Database.insert( docs.continents, data );
  }

  static down( db: Object ) {
    // should return a promise
  }
}