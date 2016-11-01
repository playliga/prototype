/* eslint-disable no-console */
import path from 'path';
import fs from 'fs';

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
  console.log( 'checking if cache directory exists...' );

  if( !fs.existsSync( CACHE_DIR ) ) {
    console.log( 'cache directory not found. creating...' );
    fs.mkdirSync( CACHE_DIR );
  }

  console.log( 'Done.' );
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
function fetchDivisionPage( url ) {
  // Do we have a cache to load from?
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
      html = await fetchDivisionPage( DIVISION_URL + divisionId );
    }
  });
}

export default {
  init
};
