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
  { name: 'Advanced', minlen: 20, teams: [] as any[] },
  { name: 'Main', minlen: 20, teams: [] },
];
const LOWTIERS = [
  { name: 'Intermediate', minlen: 150, teams: [] as any[] },
  { name: 'Open', minlen: 150, teams: [] },
];
const REGIONS = [
  { id: 1, name: 'North_America', tiers: TIERS, lowtiers: LOWTIERS },
  { id: 2, name: 'Europe', tiers: TIERS, lowtiers: LOWTIERS },
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
  public lowtiers: Tier[] = []
}


/**
 * LIQUIPEDIA SCRAPER
 *
 * Generates data for the top two ESEA divisions:
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
async function gentier( tier: Tier, region: Region ): Promise<Tier> {
  // bail early if this tier has
  // already met the minplayer req
  if( tier.teams.length >= tier.minlen ) {
    return Promise.resolve( tier );
  }

  // get the team data
  const url = `ESEA/Season_${currentseason}/${tier.name}/${region.name}`;
  const data = await lqscraper.generate( url ) as never[];

  // dedupe logic
  const existingteams = tier.teams.map( ( t: any ) => t.name );
  const newteams = data.filter( ( t: any ) => existingteams.indexOf( t.name ) < 0 );
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
 * ESEA STATSPAGE SCRAPER
 *
 * Generates data for the bottom two divisions:
 * - Intermediate
 * - Open
 *
 * The data is fetched by parsing player and their team
 * data from the ESEA stats page.
 *
 * It will recursively fetch the next page until the
 * region's minimum team+player limits are reached.
 */

// constants
const MAXPAGE   = 20;   // how many pages to try before giving up
const PER_SQUAD = 5;    // how many players per team


// init scraper
const statscraper = new ScraperFactory(
  path.join( THISPATH, 'cache' ),
  'esea-csgo-statspage'
);


// utility functions=
function sum( arr: any[], prop: string ) {
  let total = 0;

  for ( let i = 0; i < arr.length; i++ ) {
    total += arr[i][prop];
  }

  return total;
}


function toregion( region: Region, data: any[][] ): Region {
  // data: [ Team[], Player[] ]
  //
  // the data must transform into: Region.lowtiers
  //
  // 1. loop through teams
  // 2. take PER_SQUAD from player array
  // 3. take those teams and place into interm+open tiers
  // 4. return Region object

  // get the region and team+player data
  const [ teams, players ] = data;

  // load the division teams
  const im = region.lowtiers[0];
  const open = region.lowtiers[1];

  // fill in the division's minlen requirements
  let imteams = teams
    .slice( 0, im.minlen )
    .map( ( team, idx ) => ({
      ...team,
      players: players.slice(
        PER_SQUAD * idx,                  // start
        ( PER_SQUAD * idx ) + PER_SQUAD   // end
      )
    }))
  ;
  let openteams = teams
    .slice( im.minlen, im.minlen + open.minlen )
    .map( ( team, idx ) => ({
      ...team,
      players: players.slice(
        ( PER_SQUAD * idx ) + PER_SQUAD + ( im.minlen * PER_SQUAD ),  // start
        ( PER_SQUAD * idx ) + ( PER_SQUAD * 2 ) + ( im.minlen * PER_SQUAD )   // end
      )
    }))
  ;

  // do we have extra teams and players to distribute?
  const teamsoffset = open.minlen + im.minlen;
  const playersoffset = teamsoffset * PER_SQUAD;
  const extrateams = teams.slice( teamsoffset );
  const extraplayers = players.slice( playersoffset );
  const possibleteams = Math.floor( extraplayers.length / PER_SQUAD );

  if( possibleteams > 0 ) {
    const otherteams = extrateams
      .slice( 0, possibleteams )
      .map( ( team, idx ) => ({
        ...team,
        players: extraplayers.slice(
          PER_SQUAD * idx,                  // start
          ( PER_SQUAD * idx ) + PER_SQUAD   // end
        )
      }))
    ;

    // now split the extra teams evenly into both divisions
    const middleoffset = Math.floor( otherteams.length / 2 );
    openteams = [ ...openteams, ...otherteams.slice( 0, middleoffset ) ];
    imteams = [ ...imteams, ...otherteams.slice( middleoffset ) ];
  }

  return {
    ...region,
    lowtiers: [
      { ...im, teams: imteams },
      { ...open, teams: openteams },
    ]
  };
}


// generator functions
async function genESEAregion(
  region: Region,
  data: any[][],
  currentpage = 1
): Promise<any[][]> {
  if( currentpage > MAXPAGE ) {
    return Promise.resolve( data );
  }

  // load existing team+player data
  const [ teamdata, playerdata ] = data;
  const totalteams = sum( region.lowtiers, 'minlen' );
  const totalplayers = totalteams * PER_SQUAD;

  // get new player+team data
  const args = { region_id: region.id, page: currentpage };
  const [ newteamdata, newplayerdata ] = await statscraper.generate( args ) as any[];

  // merge and dedupe the results
  const teams = uniqBy([ ...teamdata, ...newteamdata ], 'name' );
  const players = uniqBy([ ...playerdata, ...newplayerdata ], 'alias' );
  let result = [ teams, players ];

  // print status message
  console.log(
    ctable.getTable(
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
    )
  );

  // do we have to look for more?
  //
  // check team length first
  if( teams.length < totalteams ) {
    result = await genESEAregion( region, result, currentpage + 1 );
  }

  // then check if we have enough players to fill the teams
  if( result[1].length < totalplayers ) {
    result = await genESEAregion( region, result, currentpage + 1 );
  }

  return Promise.resolve( result );
}


async function genESEAregions( regions: Region[] ): Promise<Region[]> {
  // generate the necessary teams+players per region.
  const nadata = await genESEAregion( regions[0], [ [], [] ] );
  const eudata = await genESEAregion( regions[1], [ [], [] ] );

  // distribute the team+player data into
  // the lower tiers of each region
  const { lowtiers: nalow } = toregion( regions[0], nadata );
  const { lowtiers: eulow } = toregion( regions[1], eudata );
  const regiondata = [
    { ...regions[0], lowtiers: nalow },
    { ...regions[1], lowtiers: eulow }
  ];

  return Promise.resolve( regiondata );
}


/**
 *
 * Main scraper function
 *
 */

// utility functions
function normalizeregion( region: Region ) {
  const teams = [] as any[];

  // offset the top tiers since `tier: 0` is reserved for pro tier
  const pro_offset = 1;

  // hightiers (1 thru 2)
  region.tiers.forEach( ( tier, tierid ) => {
    tier.teams.forEach( teamobj => {
      // delete the unused "id" props from both teams+players
      delete teamobj.id;
      teamobj.players.forEach( ( p: any ) => { delete p.id; });

      // push the formatted team to the teams array
      teams.push({
        ...teamobj,
        tier: tierid + pro_offset,
        region_id: region.id
      });
    });
  });

  // lowtiers (3 and 4)
  const tieroffset = region.tiers.length + pro_offset;

  region.lowtiers.forEach( ( tier, tierid ) => {
    tier.teams.forEach( teamobj => {
      // delete the unused "id" props from both teams+players
      delete teamobj.id;
      teamobj.players.forEach( ( p: any ) => { delete p.id; });

      // push the formatted team to the teams array
      teams.push({
        ...teamobj,
        tier: tieroffset + tierid,
        region_id: region.id,
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

  console.log( dedent`
    ===============================
    Generating data for lower tiers
    ===============================
  `);
  const [ nalow, eulow ] = await genESEAregions( REGIONS );

  // combine everything together
  const data = [
    { ...REGIONS[0], tiers: nahigh.tiers, lowtiers: nalow.lowtiers },
    { ...REGIONS[1], tiers: euhigh.tiers, lowtiers: eulow.lowtiers },
  ];

  // normalize the regional data into a flat array of teams
  // make sure to dedupe before saving it to the file
  const teams = uniqBy( flatten( data.map( normalizeregion ) ), 'name' );

  // now save everything to output file
  fs.writeFile( args.o, JSON.stringify( teams ), 'utf8', () => {
    console.log( dedent`
      =============================
      Finished.
      =============================

      Saved ${teams.length} teams after dedupe.
    `);
  });
}


run();
