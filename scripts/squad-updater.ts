import path from 'path';
import ctable from 'console.table';
import Database from '../app/main/lib/database';
import { ScraperFactory } from '../app/main/lib/scraper-factory';


// module variables
const ROOTPATH        = path.join( __dirname, '../' );
const THISPATH        = __dirname;
const DBPATH          = path.join( ROOTPATH, 'resources/databases' );
const DBINSTANCE      = new Database( DBPATH );
const SCRAPER_TIMEOUT = 4000;   // timeout for requests to not get banned
const STARTSEASON     = 32;     // starting season
const ENDSEASON       = 30;     // and then work backards
const TIERS = [
  { name: 'Premier', minlen: 20, teams: [] },
  { name: 'Advanced', minlen: 20, teams: [] },
  { name: 'Main', minlen: 20, teams: [] },
];
const REGIONS = [
  { name: 'Europe', tiers: TIERS },
  { name: 'North_America', tiers: TIERS }
];


// module class definitions
class Tier {
  public name = ''
  public teams = []
  public minlen = 20
}


class Region {
  public name = ''
  public tiers: Tier[] = []
}


// --------------------------------------


// init current season counter
let currentseason = STARTSEASON;


// init scraper
const lqscraper = new ScraperFactory(
  path.join( THISPATH, 'cache' ),
  'liquipedia-csgo-esea'
);


// utility functions
function findmissing( regions: Region[] ) {
  let missing = false;

  for( let i = 0; i < regions.length; i++ ) {
    // look for tiers that do not meet the minlen
    const found = regions[ i ]
      .tiers
      .find( tier => tier.teams.length < tier.minlen )
    ;

    // if found, bail out of the loop
    if( found ) {
      missing = true;
      break;
    }
  }

  return missing;
}


function printresults( regions: Region[] ) {
  console.log( `Results (Season ${currentseason})` );
  console.log( '===================' );
  regions.forEach( region => {
    const result = region.tiers.map( tier => ({
      tier: tier.name,
      count: `${tier.teams.length} of ${tier.minlen}`,
      status: tier.teams.length >= tier.minlen ? '✅' : '❌'
    }));
    const output = ctable.getTable( region.name, result );
    console.log( output );
  });
}


// world generators
async function gentier( tier: Tier, regionname: string ): Promise<Tier> {
  // bail early if this tier has
  // already met the minplayer req
  if( tier.teams.length >= tier.minlen ) {
    return Promise.resolve( tier );
  }

  const url = `ESEA/Season_${currentseason}/${tier.name}/${regionname}`;
  const data = await lqscraper.generate( url ) as never[];
  const teams = [ ...tier.teams, ...data ];

  return new Promise( res => {
    setTimeout(
      () => res({ ...tier, teams }),
      SCRAPER_TIMEOUT
    );
  });
}


async function genregion( region: Region ): Promise<Region> {
  return new Promise( resolve => {
    Promise
      .all( region.tiers.map( tdef => gentier( tdef, region.name ) ) )
      .then( tiers => resolve({ ...region, tiers }) )
    ;
  });
}


async function genseason( regions: Region[] ) {
  const result = await Promise.all( regions.map( genregion ) );
  printresults( result );

  // keep track of tiers that still need players
  const missing = findmissing( result );

  // tiers missing players so we
  // must continue the main loop
  if( missing && currentseason > ENDSEASON ) {
    currentseason -= 1;
    genseason( result );
  }
}


// establish db connection and
// execute code once established
const cnx = DBINSTANCE.connect();
cnx.then( () => genseason( REGIONS ) );
