import { continents, countries } from 'countries-list';


function continentFormatter( continentCode ) {
  // collect countries for current continent
  const continentCountries = Object.keys( countries )
    .map( ( countryCode: string ) => countries[ countryCode ] )
    .filter( ( country ) => country.continent === continentCode );

  // return object with continent and country data
  return {
    code: continentCode,
    name: continents[ continentCode ],
    countries: continentCountries
  };
}


export default class Seeder {
  static up( docs ) {
    const data = Object.keys( continents ).map( continentFormatter );
    return docs.continents.insert( data );
  }

  static down( db ) {
    // should return a promise
  }
}
