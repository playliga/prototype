/* eslint-disable no-inner-declarations, no-console */
import 'babel-polyfill';
import minimist from 'minimist';
import path from 'path';

import ScraperFactory from './scraper-factory';

export CachedScraper from './cached-scraper';
export ScraperFactory from './scraper-factory';

// if file is run through console, configure flags and arguments
// run function if necessary
const args = minimist( process.argv.slice( 2 ), {
  boolean: [ 'console' ]
});

if( args.console ) {
  async function run() {
    const factoryObj = new ScraperFactory( path.join( __dirname, 'cache' ), 'esea-csgo' );
    console.log( await factoryObj.generate() );
  }

  run();
}