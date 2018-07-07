import 'babel-polyfill';
import minimist from 'minimist';
import run from './squad-updater';

export CachedScraper from './cached-scraper';
export ScraperFactory from './scraper-factory';

// if file is run through console, configure flags and arguments
// run function if necessary
const args = minimist( process.argv.slice( 2 ), {
  boolean: [ 'console' ]
});

if( args.console ) {
  run();
}