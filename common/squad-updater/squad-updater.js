// @flow

/* eslint-disable no-console */
import chalk from 'chalk';
import cheerio from 'cheerio';
import cloudscraper from 'cloudscraper';
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import { camelCase } from 'lodash';

const BASE_URL = 'https://play.esea.net';
const DIVISION_URL = `${BASE_URL}/index.php?s=league&d=standings&division_id=`;
const REGIONS = {
  na: [ '2490', '2491' ], // professional, premier, ..., open
  eu: [ '2485', '2505' ]
};

type Player = {
  id: string,
  username: string,
  countryCode: string,
  teamId: string,
  transferValue: number,
  skillTemplate: string,
  weaponTemplate: string
};

type Team = {
  id: string,
  tag: string,
  countryCode: string,
  division: string,
  skillTemplate: string,
  squad: Array<Player>
};

/*
* Cloudscraper is a tool used to scrape sites that are protected by cloudflare
* but unfortunately it does not return a promise. Here we're fixing that by
* wrapping cloudscraper in one. :)
*
* NOTE: delaying response by five seconds
* See: https://github.com/codemanki/cloudscraper#wat
*/
function scraper( url ) {
  return new Promise( ( resolve, reject ) => {
    cloudscraper.get( url, ( err, res, body ) => setTimeout( () => resolve( body ), 5000 ) );
  });
}

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
*
* `cacheFileFetch`
* Used when fetching the html of a page. Will first check to see if the
* specified id was found in cache. If not, it will send the request and then
* store the returned data in cache.
*/
const CACHE_DIR = path.join( __dirname, './cache' );

function cacheDirCheck() {
  console.log( chalk.green( 'Checking if cache directory exists...' ) );

  if( !fs.existsSync( CACHE_DIR ) ) {
    console.log( chalk.red( 'Cache directory not found. Creating...' ) );
    fs.mkdirSync( CACHE_DIR );
  }

  console.log( chalk.green( 'Done.\n' ) );
}

function cacheFileCheck( fileId: string ) {
  return new Promise( ( resolve, reject ) => {
    glob( `**/*+(${fileId}).html`, { cwd: CACHE_DIR }, ( err, files ) => {
      resolve( files );
    });
  });
}

async function cacheFileFetch( url: string, fileId: string ) {
  // Do we have a cached file to load from?
  const CACHE_FILENAME = `${Date.now()}_${fileId}.html`;
  const CACHE_FILELIST = await cacheFileCheck( fileId );

  if( CACHE_FILELIST.length > 0 ) {
    const body = fs.readFileSync( `${CACHE_DIR}/${CACHE_FILELIST[ 0 ]}`, 'utf-8' );
    return Promise.resolve( body );
  }

  // If no cache, we can continue with making our request. After that's done
  // we save the data to cache
  const body = await scraper( url );
  fs.writeFileSync( `${CACHE_DIR}/${CACHE_FILENAME}`, body );
  console.log( chalk.blue( `[cache created] ${CACHE_DIR}/${CACHE_FILENAME}` ) );

  return Promise.resolve( body );
}

/*
* SCRAPER FUNCTIONS
* Useful functions for scraping the data off of the html page fetched for each
* region and its divisions
*/
function extractTeamURLs( data ): Array<Object> {
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

function extractTeamInfo( teamData, html ): Team {
  const $ = cheerio.load( html );
  const profileElem = $( '#teams-profile hr + section' );
  const profileInfoElem = profileElem.children( 'div#profile-info' );
  const teamnameElem = profileElem.children( 'div#profile-header' ).children( 'h1' );

  // TODO: there are multiple div.row1 instances that DO NOT hold the roster. need to find a better selector
  const profileRosterElem = profileElem.children( 'div#profile-column-right' ).children( 'div.row1' );

  const teamObj: Team = {
    id: camelCase( teamnameElem.text() ),
    name: teamnameElem.text(),
    tag: profileInfoElem.children( 'div.content' ).children( 'div.data' ).html(),
    countryCode: '',
    division: teamData.division,
    skillTemplate: '',
    squad: []
  };

  // Professional = Elite
  // Premier = Expert, Very Hard
  // Main = Hard, Tough
  // Intermediate = Normal, Fair
  // Open = Easy
  switch( teamObj.division ) {
    case 'Professional':
      teamObj.skillTemplate = 'Elite';
      break;
    case 'Premier':
      teamObj.skillTemplate = ( ( teamData.placement < 3 ) ? 'Expert' : 'Very Hard' );
      break;
    case 'Main':
      teamObj.skillTemplate = ( ( teamData.placement < 3 ) ? 'Hard' : 'Tough' );
      break;
    case 'Intermediate':
      teamObj.skillTemplate = ( ( teamData.placement < 3 ) ? 'Normal' : 'Fair' );
      break;
    case 'Amateur':
      teamObj.skillTemplate = 'Easy';
      break;
    default:
      break;
  }

  // TODO: a team may not have a roster. eg: https://goo.gl/DfhSNi
  // TODO: what to do in this case?
  profileRosterElem.each( ( counter, el ) => {
    const countryElem = $( el ).children( 'a' ).children( 'img' );
    const nameElem = $( el ).children( 'a:nth-child(3)' );

    const index = countryElem.attr( 'src' ).indexOf( '.gif' );
    const countryCode = countryElem.attr( 'src' ).substring( index - 2, index );

    // Inherit first player's country code as the team's
    if( counter === 0 ) {
      teamObj.countryCode = countryCode;
    }

    teamObj.squad.push({
      id: camelCase( nameElem.text() ),
      username: nameElem.text(),
      countryCode,
      teamId: teamObj.id,
      transferValue: 0, // TODO
      skillTemplate: teamObj.skillTemplate,
      weaponTemplate: ( ( counter % 4 === 0 ) ? 'Sniper' : 'Rifle' )
    });
  });

  return teamObj;
}

function uniqueURLs( arr: Array<Object> ): Array<Object> {
  const unique = [];
  const parsed = [];

  arr.forEach( ( obj, index ) => {
    if( parsed.indexOf( obj.url ) < 0 ) {
      unique.push( obj );
      parsed.push( obj.url );
    }
  });

  arr.length = 0; // eslint-disable-line no-param-reassign
  for( let i = 0; i < unique.length; i++ ) {
    arr.push( unique[ i ] );
  }

  return arr;
}

/*
* Couple of things to do here:
* 1. Loop through each region and its divisions. Fetch each division page
* and extract all of the team URLs
*/
function init() {
  // create cache directory if it does not already exist
  cacheDirCheck();

  Object.keys( REGIONS ).map( async ( regionId: string ) => {
    const regionDivisionIds = REGIONS[ regionId ];

    for( let i = 0; i < regionDivisionIds.length; i++ ) {
      const divisionId = regionDivisionIds[ i ];
      const divisionHTML = await cacheFileFetch( DIVISION_URL + divisionId, divisionId );

      // remove any duplicates (post-season/pre-season)
      let teamURLs = extractTeamURLs( divisionHTML );
      teamURLs = uniqueURLs( teamURLs );

      // each team url is fetched and added to an array of promises
      // once fetched, check for cache too!
      teamURLs.forEach( async ( urlInfo ) => {
        // extract team's id from the url. (it's in there somewhere :D)
        const teamURL = BASE_URL + urlInfo.url;
        const teamId = teamURL.split( '?' )[ 0 ].split( 'teams/' )[ 1 ];
        const teamHTML = await cacheFileFetch( teamURL, teamId );

        console.log( extractTeamInfo( urlInfo, teamHTML ) );
      });
    }
  });
}

export default {
  init
};
