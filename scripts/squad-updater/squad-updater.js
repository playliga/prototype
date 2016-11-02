/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import glob from 'glob';

const BASE_URL = 'https://play.esea.net';
const DIVISION_URL = `${BASE_URL}/index.php?s=league&d=standings&division_id=`;
const REGIONS = {
  na: [ '2490', '2491' ], // professional, premier, ..., open
  eu: [ '2485', '2505' ]
};

const CACHE_DIR = path.join( __dirname, './cache' );

/*
* Create cache directory if not already exists. It's fine to block execution
* as we'd do the same thing if we were to do it async.
*/
function cacheDirCheck() {
  console.log( chalk.green( 'Checking if cache directory exists...' ) );

  if( !fs.existsSync( CACHE_DIR ) ) {
    console.log( chalk.red( 'Cache directory not found. Creating...' ) );
    fs.mkdirSync( CACHE_DIR );
    console.log( chalk.green( 'Done.' ) );
  } else {
    console.log( chalk.green( 'Cache directory found.' ) );
  }
}

// Search for specified division's cache files
// useful for when deciding whether to fetch directly from website or not
function cacheFileCheck( divisionId ) {
  return new Promise( ( resolve, reject ) => {
    glob( `**/*+(${divisionId}).html`, { cwd: CACHE_DIR }, ( err, files ) => {
      resolve( files );
    });
  });
}

/*
* Each division has a landing page we need to fetch so that it can then be
* loaded as an html string.
*
* After the pages are fetched they should be cached. Subsequent instantiations
* should load the html from the cache rather than hitting the web page directly.
*
* Unless told otherwise...
*/
async function fetchDivisionPage( divisionId ) {
  // Do we have a cache to load from?
  const CACHE_FILENAME = `${Date.now()}_${divisionId}.html`;
  const CACHE_DATA = await cacheFileCheck( divisionId );

  if( CACHE_DATA.length > 0 ) {
    return Promise.resolve( CACHE_DATA );
  }

  // If no cache, we can continue with making our request. After that's done
  // we save the data to cache
}

/*
* Couple of things to do here:
* 1. Loop through each region and its divisions. Fetch each division page
* and extract all of the team URLs
*/
function init() {
  let region;
  let divisionId;
  let html;

  // create cache directory if it does not already exist
  cacheDirCheck();

  Object.keys( REGIONS ).map( async ( regionId ) => {
    region = REGIONS[ regionId ];

    for( let i = 0; i < region.length; i++ ) {
      divisionId = region[ i ];
      html = await fetchDivisionPage( divisionId );
    }
  });
}

export default {
  init
};
