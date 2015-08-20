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

// loop through each region and its divisions
// extract team list for each division and squads for each team
for( var region in regions ) {
  for( var i = 0; i < regions[ region ].length; i++ ) {
    var division = regions[ region ][ i ];
    var teamURLs = [];

    var teamURLsFetched = wget( DIVISION_URL + division ).then( function( data ) {
      var $ = cheerio.load( data );
      var teamListElem = $( '#league-standings table tr[class*="row"]' );

      teamListElem.each( function( counter, el ) {
        var teamContainer = $( this ).children( 'td:nth-child(2)' );
        var teamURL = teamContainer.children( 'a:nth-child(2)' ).attr( 'href' );

        teamURLs.push( teamURL.replace( /\./g, '&period[' ) );
      });

      return Promise.resolve( teamURLs );
    });
   
    // don't do this until all pages are fetched for current division
    teamURLsFetched.then( function( teamURLs ) {
      for( var j = 0; j < teamURLs.length; j++ ) {
        wget( BASE_URL + teamURLs[ j ] ).then( function( data ) {
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

          console.log( teamObj.name );
        });
      }
    });
  }
}






function wget( url ) {
  return new Promise( function( resolve, reject ) {
    request( url, function( error, response, data ) {
      if( !error && response.statusCode == 200 ) resolve( data );
      else reject( error );
    });
  });
}

var console = { // hehe...
  log: function( str ) {
    process.stdout.write( JSON.stringify( str ) + "\n" );
  }
};
