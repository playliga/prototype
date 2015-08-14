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
var $ = null;

var loadPagePromise = new Promise( function( resolve, reject ) {
  return request( 'http://google.com', function( error, response, body ) {
    if( !error && response.statusCode == 200 ) resolve( body );
    else reject( error );
  });
});

loadPagePromise.then( function( body ) {
  $ = cheerio.load( body );
  process.stdout.write( $( '#xjsi', 'html' ).html() );
}).catch( function( error ) {
  process.stdout.write( error );
});
