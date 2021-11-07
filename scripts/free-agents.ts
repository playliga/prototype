import path from 'path';
import fs from 'fs';
import minimist from 'minimist';
import dedent from 'dedent';
import ctable from 'console.table';
import { flatten, uniqBy } from 'lodash';
import { ScraperFactory } from 'main/lib/scraper-factory';


// module variables
const THISPATH        = __dirname;
const DEFAULT_OUT     = 'fa-out.json';
const DEFAULT_PLAYERS = 100;
const STARTPAGE       = 30;                 // which page to start on
const MAXPAGE         = 31;                 // how many pages to try before giving up


// configure command line args
const args = minimist( process.argv.slice( 2 ), {
  string: [ 'o', 'p' ],
  alias: { o: 'out', p: 'players' },
  default: { o: path.join( THISPATH, DEFAULT_OUT ), p: DEFAULT_PLAYERS }
});


const REGIONS = [
  { id: 1, name: 'North_America', players: [] as any[] },
  { id: 2, name: 'Europe', players: [] },
];


class Region {
  public id = 1;
  public name = ''
  public players: any[] = []
}


/**
 * ESEA STATSPAGE SCRAPER
 *
 * Generates data for the free agents pool.
 *
 * The data is fetched by parsing player names
 * from the ESEA stats page.
 *
 * It will recursively fetch the next page until the
 * the specified player limits are reached.
 */

// init scraper
const statscraper = new ScraperFactory(
  path.join( THISPATH, 'cache' ),
  'esea-csgo-statspage'
);


// generator functions
async function genESEAregion(
  region: Region,
  data: any[],
  currentpage = 1
): Promise<any[]> {
  if( currentpage > MAXPAGE ) {
    return Promise.resolve( data );
  }

  // load existing player data
  const playerdata = data;
  const totalplayers = args.p;

  // get new player+team data
  const scraperargs = { region_id: region.id, page: currentpage };
  const [ , newplayerdata ] = await statscraper.generate( scraperargs ) as any[];

  // merge and dedupe the results
  const players = uniqBy([ ...playerdata, ...newplayerdata ], 'alias' );
  let result = players;

  // print status message
  console.log(
    ctable.getTable(
      `${region.name} (Page: ${currentpage})`, [
        {
          type: 'players',
          count: `${players.length} of ${totalplayers}`,
          status: players.length >= totalplayers ? '✅' : '❌'
        }
      ]
    )
  );

  // do we have to look for more?
  // check if we have enough players
  if( result.length < totalplayers ) {
    result = await genESEAregion( region, result, currentpage + 1 );
  }

  return Promise.resolve( result );
}


async function genESEAregions( regions: Region[] ): Promise<Region[]> {
  // generate the necessary teams+players per region.
  const nadata = await genESEAregion( regions[0], [], STARTPAGE );
  const eudata = await genESEAregion( regions[1], [], STARTPAGE );

  // configure the region data
  const regiondata = [
    { ...regions[0], players: nadata },
    { ...regions[1], players: eudata }
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
  return region.players.map( p => {
    // delete the unused "id" prop
    delete p.id;

    // push the formatted team to the teams array
    return {
      ...p,
      tier: 4,
      region_id: region.id
    };
  });
}

// main
async function run() {
  console.log( dedent`
    ===============================
    Generating free agents
    ===============================
  `);
  const [ nadata, eudata ] = await genESEAregions( REGIONS );

  // combine everything together
  const data = [
    { ...REGIONS[0], players: nadata.players },
    { ...REGIONS[1], players: eudata.players },
  ];

  const players = uniqBy( flatten( data.map( normalizeregion ) ), 'alias' );

  // now save everything to output file
  fs.writeFile( args.o, JSON.stringify( players ), 'utf8', () => {
    console.log( dedent`
      =============================
      Finished.
      =============================

      Saved ${players.length} players after dedupe.
    `);
  });
}


run();
