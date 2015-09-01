/*var app = require('app');
var BrowserWindow = require('browser-window');
var mainWindow = null; // prevent window being GC'd

require('crash-reporter').start();

// listen to application events
app.on('window-all-closed', function() {
  // when closing, OSX has some issues so we manually close it below
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({width: 800, height: 600, center: true});
  mainWindow.loadUrl('file://' + __dirname + '/renderer/static/index.html');
  mainWindow.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});*/

// -----------------------------------------------
//
// -----------------------------------------------

var request = require( 'request' );
var cheerio = require( 'cheerio' );
var fs = require( 'fs' );

// create array of regions and their division urls
var BASE_URL = 'https://play.esea.net';
var DIVISION_URL = BASE_URL + '/index.php?s=league&d=standings&division_id=';
var regions = {
  'na': [ '2490', '2491' ], // professional, premier, ..., open
  'eu': [ '2485', '2505' ]
};

// helper functions
var console = { // hehe...
  log: function( str ) {
    process.stdout.write( JSON.stringify( str ) + "\n" );
  }
};

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

  var teamObj = {
    name: profileElem.children( 'div#profile-header' ).children( 'h1' ).text(),
    tag: profileInfoElem.children( 'div.content' ).children( 'div.data' ).html(),
    country: 'US', // TODO
    division: 'Professional', // TODO
    squad: []
  };

  profileRosterElem.each( function( counter, el ) {
    var countryElem = $( this ).children( 'a' ).children( 'img' );
    var nameElem = $( this ).children( 'a:nth-child(3)' );

    var index = countryElem.attr( 'src' ).indexOf( '.gif' );
    var countryCode = countryElem.attr( 'src' ).substring( index - 2, index );

    teamObj.squad.push( {
      username: nameElem.text(),
      countryCode: countryCode,
      skillTemplate: 'Elite', // TODO
      weaponTemplate: 'Rifle' // TODO
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
for( var region in regions ) {
  regions[ region ].forEach( function( division_id, index ) {
    wget( DIVISION_URL + division_id ).then( function( data ) {
      return Promise.resolve( extractTeamURLs( data ) );
    }).then( function( teamURLs ) {
      teamURLs.unique(); // remove any duplicates (post-season/pre-season)
      teamURLs.forEach( function( teamURL, index ) {
        wget( BASE_URL + teamURL ).then( function( data ) {
          var teamObj = extractTeamInfo( data );
          console.log( teamObj.name );
        });
      });
    });
  });
}
