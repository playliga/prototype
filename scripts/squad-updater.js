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
function fetchDivisionPage( url ) {
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

// loop through each region and its divisions
// extract team list for each division and squads for each team
Object.keys( REGIONS ).map( async ( regionId ) => {
  const region = REGIONS[ regionId ];

  for( let i = 0; i < region.length; i++ ) {
    const divisionId = region[ i ];
    const html = await fetchDivisionPage( DIVISION_URL + divisionId );

    extractTeamURLs( html );
  }

  return true;
});
