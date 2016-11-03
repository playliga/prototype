/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import chalk from 'chalk';
import cheerio from 'cheerio';
import cloudscraper from 'cloudscraper';
import fs from 'fs';
import glob from 'glob';
import path from 'path';

const BASE_URL = 'https://play.esea.net';
const DIVISION_URL = `${BASE_URL}/index.php?s=league&d=standings&division_id=`;
const REGIONS = {
  na: [ '2490', '2491' ], // professional, premier, ..., open
  eu: [ '2485', '2505' ]
};

const CACHE_DIR = path.join( __dirname, './cache' );

/*
* CACHE HELPER FUNCTIONS
*
* `cacheDirCheck`
* Create cache directory if not already exists. It's fine to block execution
* as we'd do the same thing if we were to do it async.
*
* `cacheFileCheck`
* Search for specified division's cache files
* useful for when deciding whether to fetch directly from website or not
*/
function cacheDirCheck() {
  console.log( chalk.green( 'Checking if cache directory exists...' ) );

  if( !fs.existsSync( CACHE_DIR ) ) {
    console.log( chalk.red( 'Cache directory not found. Creating...' ) );
    fs.mkdirSync( CACHE_DIR );
  }

  console.log( chalk.green( 'Done.\n' ) );
}

function cacheFileCheck( divisionId ) {
  return new Promise( ( resolve, reject ) => {
    glob( `**/*+(${divisionId}).html`, { cwd: CACHE_DIR }, ( err, files ) => {
      resolve( files );
    });
  });
}

/*
* Cloudscraper is a tool used to scrape sites that are protected by cloudflare
* but unfortunately it does not return a promise. Here we're fixing that by
* wrapping cloudscraper in one. :)
*/
function scraper( url ) {
  return new Promise( ( resolve, reject ) => {
    cloudscraper.get( url, ( err, res, body ) => resolve( body ) );
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
  // Do we have a cached file to load from?
  const CACHE_FILENAME = `${Date.now()}_${divisionId}.html`;
  const CACHE_FILELIST = await cacheFileCheck( divisionId );

  if( CACHE_FILELIST.length > 0 ) {
    const body = fs.readFileSync( `${CACHE_DIR}/${CACHE_FILELIST[ 0 ]}`, 'utf-8' );
    return Promise.resolve( body );
  }

  // If no cache, we can continue with making our request. After that's done
  // we save the data to cache
  const body = await scraper( DIVISION_URL + divisionId );
  fs.writeFileSync( `${CACHE_DIR}/${CACHE_FILENAME}`, body );

  return Promise.resolve( body );
}

/*
* SCRAPER FUNCTIONS
* Useful functions for scraping the data off of the html page fetched for each
* region and its divisions
*/
function extractTeamURLs( data ) {
  const $ = cheerio.load( data );
  const teamListElem = $( '#league-standings table tr[class*="row"]' );
  const outputArr = [];

  let divisionString = $( '#league-standings section.division h1' ).html();
  divisionString = divisionString.split( 'CS:GO' );

  teamListElem.each( ( counter, el ) => {
    const teamContainerElem = $( el ).children( 'td:nth-child(2)' );
    const teamURL = teamContainerElem.children( 'a:nth-child(2)' ).attr( 'href' );

    outputArr.push({
      division: divisionString[ 1 ].trim(),
      placement: counter,
      url: teamURL.replace( /\./g, '&period[' )
    });
  });

  return outputArr;
}

/*
* Couple of things to do here:
* 1. Loop through each region and its divisions. Fetch each division page
* and extract all of the team URLs
*/
function init() {
  // create cache directory if it does not already exist
  cacheDirCheck();

  Object.keys( REGIONS ).map( async ( regionId ) => {
    const regionArr = REGIONS[ regionId ];

    for( let i = 0; i < regionArr.length; i++ ) {
      const divisionId = regionArr[ i ];
      const html = await fetchDivisionPage( divisionId );

      console.log( extractTeamURLs( html ) );
    }
  });
}

export default {
  init
};
