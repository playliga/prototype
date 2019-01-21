// @flow
import { continents } from 'countries-list';


const formatted = [];
Object.keys( continents ).forEach( ( ccode: string ) => {
  formatted.push({
    code: ccode,
    name: continents[ ccode ]
  });
});


export default class Seeder {
  static up( db: Object ) {
    return Promise.resolve( formatted );
  }

  static down( db: Object ) {
    // should return a promise
  }
}