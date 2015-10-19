var request = require( 'request' );
var cheerio = require( 'cheerio' );

// create array of regions and their division urls
var BASE_URL = 'https://play.esea.net';
var DIVISION_URL = BASE_URL + '/index.php?s=league&d=standings&division_id=';
var regions = {
  'na': [ '2490', '2491' ], // professional, premier, ..., open
  'eu': [ '2485', '2505' ]
};

// helper functions
function wget( url ) {
  return new Promise( function( resolve, reject ) {
    request( url, function( error, response, data ) {
      if( !error && response.statusCode == 200 ) resolve( data );
      else reject( error );
    });
  });
}

function extractTeamURLs( data ) {
  // extract team url and return array
  var $ = cheerio.load( data );
  var teamListElem = $( '#league-standings table tr[class*="row"]' );
  var outputArr = [];

  teamListElem.each( function( counter, el ) {
    var teamContainer = $( this ).children( 'td:nth-child(2)' );
    var teamURL = teamContainer.children( 'a:nth-child(2)' ).attr( 'href' );

    outputArr.push( teamURL.replace( /\./g, '&period[' ) );
  });

  return outputArr;
}

function extractTeamInfo( data ) {
  var $ = cheerio.load( data );
  var profileElem = $( '#teams-profile hr + section' );
  var profileInfoElem = profileElem.children( 'div#profile-info' );
  var profileRosterElem = profileElem.children( 'div#profile-column-right' ).children( 'div.row1' );

  var divisionElem = profileInfoElem.children( 'div.content' ).children( 'div.data.margin-top' ).children( 'a' ).html();
  var divisionString = divisionElem.split( 'CSGO' );
  
  var teamObj = {
    name: profileElem.children( 'div#profile-header' ).children( 'h1' ).text(),
    tag: profileInfoElem.children( 'div.content' ).children( 'div.data' ).html(),
    country: undefined,
    division: divisionString[ 1 ].trim(),
    squad: []
  };

  profileRosterElem.each( function( counter, el ) {
    var countryElem = $( this ).children( 'a' ).children( 'img' );
    var nameElem = $( this ).children( 'a:nth-child(3)' );

    var index = countryElem.attr( 'src' ).indexOf( '.gif' );
    var countryCode = countryElem.attr( 'src' ).substring( index - 2, index );

    if( counter === 0 ) {
      teamObj.country = countryCode;
    }

    switch( teamObj.division ) {
      case 'Professional':
        var skillTemplateString = 'Elite';
      break;
      case 'Premier':
        var skillTemplateString = 'Very Hard';
      break;
    }

    teamObj.squad.push({
      username: nameElem.text(),
      countryCode: countryCode,
      skillTemplate: skillTemplateString,
      weaponTemplate: ( ( counter % 4 === 0 ) ? 'Sniper' : 'Rifle' )
    });
  });

  return teamObj;
}

Array.prototype.unique = function() {
  var unique = this.reduce( function( accum, current ) {
    if(accum.indexOf( current ) < 0 ) {
      accum.push( current );
    }
    return accum;
  }, [] );

  this.length = 0;
  for( var i = 0; i < unique.length; i++ ) {
    this.push( unique[ i ] );
  }

  return this;
}

// loop through each region and its divisions
// extract team list for each division and squads for each team
module.exports = {
  init: function() {
    for( var region in regions ) {
      regions[ region ].forEach( function( division_id, index ) {
        wget( DIVISION_URL + division_id ).then( function( data ) {
          return Promise.resolve( extractTeamURLs( data ) );
        }).then( function( teamURLs ) {
          // remove any duplicates (post-season/pre-season)
          var teamsFetched = [];
          teamURLs.unique(); 
          
          // each team url is fetched and added to an array of promises
          teamURLs.forEach( function( teamURL, index ) {
            teamsFetched[ index ] = wget( BASE_URL + teamURL ).then( function( data ) {
              return Promise.resolve( extractTeamInfo( data ) );
            });
          });
          
          // once all urls for this current division are fetched we can continue
          Promise.all( teamsFetched ).then( function( teamObjArr ) {
            for( var i = 0; i < teamObjArr.length; i++ ) console.log( teamObjArr[ i ].name );
            // implement better version of DBSetupUtil
          });
        });
      });
    }
  }
};
