import path from 'path';
import Database from '../app/main/lib/database';
import { ScraperFactory } from '../app/main/lib/scraper-factory';
import { ESEA_CSGO_Region } from '../app/main/lib/scraper-factory/scrapers/esea-csgo';


// module-level variables and functions
const ROOTPATH = path.join( __dirname, '../' );
const THISPATH = __dirname;
const DBPATH = path.join( ROOTPATH, 'resources/databases' );
const DBINSTANCE = new Database( DBPATH );


// establish db connection and
// execute code once established
const cnx = DBINSTANCE.connect();
cnx.then( run );


async function run() {
  // scrape hltv for top-tier teams
  const hltvscraper = new ScraperFactory(
    path.join( THISPATH, 'cache' ),
    'hltv-csgo'
  );

  const tier0 = await hltvscraper.generate();
  console.log( tier0 );
}
