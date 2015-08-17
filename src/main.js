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
var regions = {
  'na': [
    'https://play.esea.net/index.php?s=league&d=standings&division_id=2490', // professional
    'https://play.esea.net/index.php?s=league&d=standings&division_id=2491' // premier
  ],
  'eu': [
    'https://play.esea.net/index.php?s=league&d=standings&division_id=2485', // professional
    'https://play.esea.net/index.php?s=league&d=standings&division_id=2505'
  ]
};
