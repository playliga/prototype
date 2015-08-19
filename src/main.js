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

// loop through each region
for( var region in regions ) {
  var divisions = regions[ region ];
  
  // loop through each region's division
  for( var i = 0; i < divisions.length; i++ ) {
    var teamURLs = [];

    var teamURLsFetched = wget( DIVISION_URL + divisions[ i ] ).then( function( data ) {
      var $ = cheerio.load( data );
      var teamListElem = $( '#league-standings table tr[class*="row"]' );

      teamListElem.each( function( i, el ) {
        var teamContainer = $( this ).children( 'td:nth-child(2)' );
        var teamURL = teamContainer.children( 'a:nth-child(2)' ).attr( 'href' );

        teamURLs.push( teamURL.replace( /\./g, '&period[' ) );
      });

      return Promise.resolve( teamURLs );
    });
   
    // don't do this until all pages are fetched...
    teamURLsFetched.then( function( teamURLs ) {
      for( var i = 0; i < teamURLs.length; i++ ) {
        // wget and extract information from each team URL
        wget( BASE_URL + teamURLs[ i ] ).then( function( data ) {
          var $ = cheerio.load( data );
          var profileElem = $( '#teams-profile hr + section' );
          var teamObj = {
            name: profileElem.children( 'div#profile-header' ).children( 'h1' ).text(),
            tag: profileElem.children( 'profile-info content div[class*="data"]:nth-child(1)' ).text() 
          };

          console.log( teamObj );
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
