// @flow
/* eslint-disable import/no-dynamic-require */
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import minimist from 'minimist';
import adjectiveAnimal from 'adjective-animal';
import Sequelize from 'sequelize';

import Models from './database/models';

// $FlowSkip
const config = require(
  path.join( __dirname, 'database/config/config.json' )
)[ process.env.NODE_ENV || 'development' ];

// Use IPC for the adjective-animal library since it calls
// __dirname internally, and electron's renderer process mangles
// that built in
ipcMain.on( 'adjective-animal', ( e: Object, arg: number ) => {
  e.returnValue = adjectiveAnimal.generateNameList( arg );
});

// Set up the database
const sequelize = new Sequelize( config );

sequelize.authenticate()
  .then( () => (
    Models.sequelize.sync()
      .then( () => console.log( 'success' ) )
  ) )
  .catch( err => console.log( 'error' ) );

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// configure command line args
const args = minimist( process.argv.slice( 2 ), {
  boolean: [ 'dev-console' ]
});

function createWindow() {
  // Create the browser window.
  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md
  // https://github.com/electron/electron/blob/master/docs/api/frameless-window.md
  win = new BrowserWindow({
    titleBarStyle: 'hidden',
    backgroundColor: '#000000',
    minWidth: 800,
    minHeight: 600,
    maximizable: false
  });

  // and load the index.html of the app
  win.loadURL( `file://${__dirname}/renderer-process/index.html` );

  // open dev tools if provided via cli args
  if( args[ 'dev-console' ] ) {
    win.openDevTools();
  }

  // Emitted when the window is closed.
  win.on( 'closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on( 'ready', createWindow );

// Quit when all windows are closed.
app.on( 'window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if( process.platform !== 'darwin' ) {
    app.quit();
  }
});

app.on( 'activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if( win === null ) {
    createWindow();
  }
});
