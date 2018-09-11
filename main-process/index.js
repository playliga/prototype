// @flow
import { app, BrowserWindow } from 'electron';
import Sequelize from 'sequelize';

import ipc from './ipc';
import { SplashWindow, WorldGenWindow } from './window-handlers';
import Models from '../database/models';
import DBConfig from '../database/config/config.json';


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windowList: Array<BrowserWindow> = [];

export default () => {
  // Set up the database
  const sequelize = new Sequelize( DBConfig[ process.env.NODE_ENV || 'development' ] );

  sequelize.authenticate()
    .then( () => Models.sequelize.sync() )
    .then( () => console.log( 'success' ) )
    .catch( err => console.log( 'error' ) );

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on( 'ready', () => {
    ipc();
    SplashWindow( windowList );
    WorldGenWindow();
  });

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
    // TODO: but which one?
    if( windowList.length === 0 ) {
      SplashWindow( windowList );
    }
  });
};
