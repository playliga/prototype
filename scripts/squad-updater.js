/* eslint-disable import/no-extraneous-dependencies */
import fs from 'fs';
import cloudscraper from 'cloudscraper'; // needed to bypass DDoS protections
import cheerio from 'cheerio';

// create array of regions and their division urls
const BASE_URL = 'https://play.esea.net';
const DIVISION_URL = `${BASE_URL}/index.php?s=league&d=standings&division_id=`;
const REGIONS = {
  na: [ '2490', '2491' ], // professional, premier, ..., open
  eu: [ '2485', '2505' ]
};

// helper functions
function fetchDivisionPageHTML( url ) {
  return new Promise( ( resolve, reject ) => {
    // cloudscraper.get( url, ( err, res, body ) => {
    //   resolve( body );
    // });
    fs.readFile( './esea.html', ( err, body ) => {
      resolve( body );
    });
  });
}

function extractTeamURLs( data ) {
  const $ = cheerio.load( data );
  const teamListElem = $( '#league-standings table tr[class*="row"]' );
  const teamDivisionString = $( '#league-standings section.division h1' ).html();
  const divisionString = teamDivisionString.split( 'CS:GO' );
  const outputArr = [];

  teamListElem.each( ( counter, el ) => {
    const teamContainer = $( el ).children( 'td:nth-child(2)' );
    const teamURL = teamContainer.children( 'a:nth-child(2)' ).attr( 'href' );

    outputArr.push({
      division: divisionString[ 1 ].trim(),
      placement: counter,
      url: teamURL.replace( /\./g, '&period[' )
    });
  });

  return outputArr;
}

// loop through each region and its divisions
// extract team list for each division and squads for each team
Object.keys( REGIONS ).map( ( regionId ) => {
  const region = REGIONS[ regionId ];

  for( let i = 0; i < region.length; i++ ) {
    const divId = region[ i ];

    fetchDivisionPageHTML( DIVISION_URL + divId ).then( ( html ) => {
      extractTeamURLs( html );
    });
  }

  return true;
});
