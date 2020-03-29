import { continents, countries } from 'countries-list';


function continentFormatter( continentCode: string ) {
  // collect countries for current continent
  const continentCountries = Object.keys( countries )
    // @ts-ignore
    .map( ( countryCode: string ) => countries[ countryCode ] )
    .filter( ( country ) => country.continent === continentCode );

  // return object with continent and country data
  return {
    code: continentCode,
    // @ts-ignore
    name: continents[ continentCode ],
    countries: continentCountries
  };
}


export default class Seeder {
  static up( docs: any ) {
    const data = Object.keys( continents ).map( continentFormatter );
    return docs.continents.insert( data );
  }

  static down( db: any ) {
    // should return a promise
  }
}
