var app = require('app');
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
});

// -----------------------------------------------
//
// -----------------------------------------------

var request = require( 'request' );
var cheerio = require( 'cheerio' );
var fs = require( 'fs' );

var na_divs = [ 'https://play.esea.net/index.php?s=league&d=standings&division_id=2490' ];
var na_promises = buildPromiseArr( na_divs );

function buildPromiseArr( arr ) {
  var outputArr = [];

  for( var i = 0; i < arr.length; i++ ) {
    outputArr.push( new Promise( function( resolve, reject ) {
      return request( arr[ i ], function( error, response, body ) {
        if( !error && response.statusCode == 200 ) resolve( body );
        else reject( error );
      });
    }) );
  }

  return outputArr;
}

Promise.all( na_promises ).then( function( data ) {
  var $ = cheerio.load( data[ 0 ] );
  var teamList = $('#league-standings table tr[class*="row"]' );

  teamList.each( function( i, el ) {
    var teamContainer = $( this ).children( 'td:nth-child(2)' );
    var teamCountryCode = teamContainer.children( 'a:nth-child(1)' ).children( 'img' ).attr( 'src' );
    var teamName = teamContainer.children( 'a:nth-child(2)' );
    var teamURL = teamName.attr( 'href' );
    
    // extract country code from url string
    var index = teamCountryCode.indexOf( '.gif' );
    teamCountryCode = teamCountryCode.substring( index - 2, index );

    // create initial teamObj with basic info extracted above
    var teamObj = { name: teamName.text(), tag: null, country: teamCountryCode, squad: [] };

    process.stdout.write( JSON.stringify( teamObj ) );
  });

  fs.writeFile( __dirname + '/renderer/static/data/na_professional.json', 'Hello from Node.JS', function( err ) {
    if( err ) process.stdout.write( err );
  });
}).catch( function( error ) {
  process.stdout.write( error );
});
