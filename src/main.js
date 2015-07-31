var app = require('app');
var BrowserWindow = require('browser-window');
var mainWindow = null; // prevent window being GC'd

// report crashes to electron
require('crash-reporter').start();

// when the main window is closed
app.on('window-all-closed', function() {
  // when closing, OSX has some issues so we manually close it below
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// this is our main app window
// you can specify different properties for it when instantiating
app.on('ready', function() {
  mainWindow = new BrowserWindow({width: 800, height: 600, center: true});
  mainWindow.loadUrl('file://' + __dirname + '/static/index.html');
  mainWindow.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
