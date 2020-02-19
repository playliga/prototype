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
  // get esea:csgo teams and their players
  const factoryObj = new ScraperFactory(
    path.join( THISPATH, 'cache' ),
    'esea-csgo'
  );

  const esea_regions = await factoryObj.generate() as ESEA_CSGO_Region[];
  // region { id, divisions }
  // divisions { id, name, teams }
  // team { id, name, placement, ..., squad: player[] }
  // player { id, ..., username }

  esea_regions.forEach( r => {
    r.divisions.forEach( d => {
      d.teams.forEach( t => console.log( d.name, t.name ) );
    });
  });
}
