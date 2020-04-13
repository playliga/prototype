import path from 'path';
import fs from 'fs';
import minimist from 'minimist';
import dedent from 'dedent';
import ctable from 'console.table';
import { flatten } from 'lodash';
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
  { name: 'Premier', minlen: 20, teams: [] },
  { name: 'Advanced', minlen: 20, teams: [] },
  { name: 'Main', minlen: 20, teams: [] },
];
const LOWTIERS = [
  { name: 'Intermediate', minlen: 60, teams: [] },
  { name: 'Open', minlen: 100, teams: [] },
];
const REGIONS = [
  { name: 'Europe', tiers: TIERS, lowtiers: LOWTIERS },
  { name: 'North_America', tiers: TIERS, lowtiers: LOWTIERS }
];


// module class definitions
class Tier {
  public name = ''
  public teams: any[] = []
  public minlen = 20
}


class Region {
  public name = ''
  public tiers: Tier[] = []
  public lowtiers: Tier[] = []
}


/**
 * LIQUIPEDIA SCRAPER
 *
 * Generates data for the top three divisions:
 * - Premier
 * - Advanced
 * - Main
 *
 * The data is fetched recursively in chunks organized
 * by seasons. If the team count does not meet the
 * requirements another season is fetched.
 */

// constants
const STARTSEASON     = 32;     // starting season
const ENDSEASON       = 25;     // and then work backards


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

  // get the team data
  const url = `ESEA/Season_${currentseason}/${tier.name}/${regionname}`;
  const data = await lqscraper.generate( url ) as never[];

  // dedupe logic
  const existingteams = tier.teams.map( ( t: any ) => t.name );
  const newteams = data.filter( ( d: any ) => existingteams.indexOf( d.name ) < 0 );
  const teams = [ ...tier.teams, ...newteams ];
  return Promise.resolve({ ...tier, teams });
}


async function genregion( region: Region ): Promise<Region> {
  return new Promise( resolve => {
    Promise
      .all( region.tiers.map( tdef => gentier( tdef, region.name ) ) )
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
 * ESEA STATSPAGE SCRAPER
 *
 * @todo
 */

// constants
const MAXPAGE   = 13;   // how many pages to try before giving up
const PER_SQUAD = 5;    // how many players per team


// init scraper
const statscraper = new ScraperFactory(
  path.join( THISPATH, 'cache' ),
  'esea-csgo-statspage'
);


// utility functions
function dedupe( arr: any[] ) {
  return Array
    .from( new Set( arr.map( ( item: any ) => item.id ) ) )
    .map( id => arr.find( ( item: any ) => item.id === id ) )
  ;
}


function sum( arr: any[], prop: string ) {
  let total = 0;

  for ( let i = 0; i < arr.length; i++ ) {
    total += arr[i][prop];
  }

  return total;
}


function toregion( region: Region, rdata: any[][] ): Region {
  // data: [ Team[], Player[] ]
  //
  // the data must transform into: Region.lowtiers
  //
  // 1. loop through teams
  // 2. take PER_SQUAD from player array
  // 3. take those teams and place into interm+open tiers
  // 4. return Region object

  // get the region and team+player data
  const [ teams, players ] = rdata;

  // load the divisions for the current region
  const im = region.lowtiers[0];
  const open = region.lowtiers[1];

  // @todo
  im.teams = teams
    .slice( 0, im.minlen )
    .map( ( team, idx ) => ({
      ...team,
      players: players.slice(
        PER_SQUAD * idx,                  // start
        ( PER_SQUAD * idx ) + PER_SQUAD   // end
      )
    }))
  ;
  open.teams = teams
    .slice( im.minlen, im.minlen + open.minlen )
    .map( ( team, idx ) => ({
      ...team,
      players: players.slice(
        ( PER_SQUAD * idx ) + im.minlen,              // start
        ( PER_SQUAD * idx ) + PER_SQUAD + im.minlen   // end
      )
    }))
  ;

  return region;
}


// generator functions
async function genESEAregion(
  region: Region,
  data: any[],
  currentpage = 1
): Promise<any> {
  if( currentpage > MAXPAGE ) {
    return Promise.resolve( data );
  }

  // load existing team+player data
  const [ teamdata, playerdata ] = data;
  const totalteams = sum( region.lowtiers, 'minlen' );
  const totalplayers = totalteams * PER_SQUAD;

  // get new player+team data
  const args = { region_id: 1, page: currentpage };
  const [ newteamdata, newplayerdata ] = await statscraper.generate( args ) as any[];

  // merge and dedupe the results
  const teams = dedupe([ ...teamdata, ...newteamdata ]);
  const players = dedupe([ ...playerdata, ...newplayerdata ]);
  let result = [ teams, players ];

  // print the results
  const out = ctable.getTable(
    `${region.name} (Page: ${currentpage})`, [
      {
        type: 'teams',
        count: `${teams.length} of ${totalteams}`,
        status: teams.length >= totalteams ? '✅' : '❌'
      },
      {
        type: 'players',
        count: `${players.length} of ${totalplayers}`,
        status: players.length >= totalplayers ? '✅' : '❌'
      }
    ]
  );

  console.log( out );

  // do we have to look for more?
  //
  // check team length first
  if( teams.length < totalteams ) {
    result = await genESEAregion( region, result, currentpage + 1 );
    return Promise.resolve( result );
  }

  // then check if we have enough players to fill the teams
  if( players.length < totalplayers ) {
    result = await genESEAregion( region, result, currentpage + 1 );
    return Promise.resolve( result );
  }

  return Promise.resolve( result );
}


async function genESEAregions( regions: Region[] ) {
  // generate the necessary teams per region.
  // which is the sum of `tiers.teams`.
  const allteamsplayers = await Promise.all(
    regions.map( region => genESEAregion( region, [ [], [] ] ) )
  );

  // now split up all the team+player
  // evenly into the regions array
  const newregions = allteamsplayers.map(
    ( rdata, idx ) => toregion( regions[idx], rdata )
  );

  return Promise.resolve( newregions );
}


/**
 *
 * Main scraper function
 *
 */

// utility functions
function normalizeregion( region: Region, idx: number ) {
  const teams = [] as any[];

  // hightiers (0 thru 2)
  region.tiers.forEach( ( tier, tierid ) => {
    tier.teams.forEach( teamobj => {
      // delete the unused "id" props from both teams+players
      delete teamobj.id;
      teamobj.players.forEach( ( p: any ) => { delete p.id; });

      // push the formatted team to the teams array
      teams.push({
        ...teamobj,
        region: idx,
        tier: tierid
      });
    });
  });

  // lowtiers (3 and 4)
  const tieroffset = region.tiers.length;

  region.lowtiers.forEach( ( tier, tierid ) => {
    tier.teams.forEach( teamobj => {
      // delete the unused "id" props from both teams+players
      delete teamobj.id;
      teamobj.players.forEach( ( p: any ) => { delete p.id; });

      // push the formatted team to the teams array
      teams.push({
        ...teamobj,
        region: idx,
        tier: tieroffset + tierid
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
  const regional_hightiers = await genseason( REGIONS );

  console.log( dedent`
    ===============================
    Generating data for lower tiers
    ===============================
  `);
  const regional_lowtiers = await genESEAregions( REGIONS );

  // combine everything together
  const data = [
    { ...REGIONS[0], tiers: regional_hightiers[0].tiers, lowtiers: regional_lowtiers[0].lowtiers },
    { ...REGIONS[1], tiers: regional_hightiers[1].tiers, lowtiers: regional_lowtiers[1].lowtiers },
  ];

  // normalize the regional data into a flat array of teams
  const teams = flatten( data.map( normalizeregion ) );

  // now save everything to output file
  fs.writeFile( args.o, JSON.stringify( teams ), 'utf8', () => {
    console.log( dedent`
      =============================
      Finished.
      =============================
    `);
  });
}


run();
