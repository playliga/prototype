import path from 'path';
import fs from 'fs';
import minimist from 'minimist';
import dedent from 'dedent';
import ctable from 'console.table';
import { flatten, uniqBy } from 'lodash';
import { ScraperFactory } from 'main/lib/scraper-factory';


// module variables
const THISPATH      = __dirname;
const DEFAULT_OUT   = 'out.json';


// configure command line args
const args = minimist( process.argv.slice( 2 ), {
  string: [ 'o' ],
  alias: { o: 'out' },
  default: { o: path.join( THISPATH, DEFAULT_OUT )}
});


const TIERS = [
  { name: 'Pro', minlen: 25, teams: [] as any[] },
];
const REGIONS = [
  { id: 1, name: 'Americas', tiers: TIERS },
  { id: 2, name: 'Europe', tiers: TIERS },
];


// module variables
const na_altregions = [
  { season: 8, altname: 'North_America' },
  { season: 7, altname: 'North_America' },
  { season: 6, altname: 'North_America' },
  { season: 5, altname: 'North_America' },
  { season: 4, altname: 'North_America' },
];


// module class definitions
class Tier {
  public name = ''
  public teams: any[] = []
  public minlen = 20
}


class Region {
  public id = 1;
  public name = ''
  public tiers: Tier[] = []
}


/**
 * LIQUIPEDIA SCRAPER
 *
 * Generates data for the Pro division.
 *
 * The data is fetched recursively in chunks organized
 * by seasons. If the team count does not meet the
 * requirements another season is fetched.
 */

// constants
const STARTSEASON     = 10;     // starting season
const ENDSEASON       = 4;      // and then work backwards


// init current season counter
let currentseason = STARTSEASON;


// init scraper
const lqscraper = new ScraperFactory(
  path.join( THISPATH, 'cache' ),
  'liquipedia-csgo-eslpro'
);


// utility functions

// @todo: can be reused in common.ts
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


// @todo: can be reused in common.ts (add currentseason arg tho)
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
async function gentier( tier: Tier, region: Region ): Promise<Tier> {
  // bail early if this tier has
  // already met the minplayer req
  if( tier.teams.length >= tier.minlen ) {
    return Promise.resolve( tier );
  }

  // the liquipedia page alternates between `North_America` and
  // `Americas` so we need to figure out which one to use
  let regionname = region.name;

  const altidx = na_altregions.findIndex( i => i.season === currentseason );

  if( region.name === 'Americas' && altidx >= 0 ) {
    regionname = na_altregions[ altidx ].altname;
  }

  // get the team data
  const url = `ESL/Pro_League/Season_${currentseason}/${regionname}`;
  const data = await lqscraper.generate( url ) as never[];

  // combine existing + new teams
  const existingteams = tier.teams.map( ( t: any ) => t.name );
  let newteams = data.filter( ( t: any ) => existingteams.indexOf( t.name ) < 0 );

  // filter out renegades (an australian team)
  // from the NA results
  if( region.name === 'Americas' ) {
    newteams = newteams.filter( ( t: any ) => t.name !== 'Renegades' );
  }

  // combine everything back together
  const teams = [ ...tier.teams, ...newteams ];
  return Promise.resolve({ ...tier, teams });
}


async function genregion( region: Region ): Promise<Region> {
  return new Promise( resolve => {
    Promise
      .all( region.tiers.map( tdef => gentier( tdef, region ) ) )
      .then( tiers => resolve({ ...region, tiers }) )
    ;
  });
}


async function genseason( regions: Region[] ): Promise<Region[]> {
  let result = await Promise.all( regions.map( genregion ) );
  printresults( result );

  // keep track of tiers that still need players
  const missing = findmissing( result );

  // tiers missing players so we must
  // try again with another season
  if( missing && currentseason > ENDSEASON ) {
    currentseason -= 1;
    result = await genseason( result );
  }

  return Promise.resolve( result );
}


/**
 *
 * Main scraper function
 *
 */

// utility functions
function normalizeregion( region: Region ) {
  const teams = [] as any[];

  region.tiers.forEach( ( tier, tierid ) => {
    tier.teams.forEach( teamobj => {
      // delete the unused "id" props from both teams+players
      delete teamobj.id;
      teamobj.players.forEach( ( p: any ) => { delete p.id; });

      // push the formatted team to the teams array
      teams.push({
        ...teamobj,
        tier: tierid,
        region_id: region.id
      });
    });
  });

  return teams;
}


// run it!
async function run() {
  console.log( dedent`
    =============================
    Generating data for top tiers
    =============================
  `);
  const [ nahigh, euhigh ] = await genseason( REGIONS );

  // combine everything together
  const data = [
    { ...REGIONS[0], tiers: nahigh.tiers },
    { ...REGIONS[1], tiers: euhigh.tiers },
  ];

  // normalize the regional data into a flat array of teams
  // make sure to dedupe before saving it to the file
  const teams = uniqBy( flatten( data.map( normalizeregion ) ), 'name' );
  const squadfilled = teams.filter( team => team.players.length >= 5 );

  // now save everything to output file
  fs.writeFile( args.o, JSON.stringify( squadfilled ), 'utf8', () => {
    console.log( dedent`
      =============================
      Finished.
      =============================

      Saved ${teams.length} teams after dedupe.
      Saved ${squadfilled.length} teams with full squads. (5 or greater).
    `);
  });
}


run();
