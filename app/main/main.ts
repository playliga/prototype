import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import log from 'electron-log';
import { Sequelize } from 'sequelize';

import * as Models from 'main/database/models';
import IpcApi from 'main/lib/ipc-api';
import { SplashWindow, MainWindow, FirstRunWindow } from 'main/windows';
import WindowManager from 'main/lib/window-manager';


/**
 * Setup db paths.
 */
const DBNAME    = 'save0.sqlite';
const DBPATH    = path.join( app.getPath( 'userData' ), 'databases' );


/**
 * Needs to run before we can show any application windows.
**/
function setupDB() {
  // copy source-controlled db if not found
  const targetpath = path.join( DBPATH, DBNAME );

  if( !fs.existsSync( targetpath ) ) {
    const localpath = path.join( __dirname, 'resources/databases', DBNAME );

    fs.mkdirSync( DBPATH );

    if( fs.existsSync( localpath ) ) {
      fs.copyFileSync( localpath, targetpath );
    }
  }

  // establish the sequelize connection
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: targetpath,
    logging: log.verbose.bind( log )
  });

  // initialize the models and their associations
  Object
    .values( Models )
    .map( m => { m.autoinit( sequelize ); return m; })
    .filter( m => typeof m.associate === 'function' )
    .forEach( m => m.associate( Models ) )
  ;

  return sequelize.authenticate();
}


function handleOnReady() {
  // setup source-controlled snapshots
  setupDB()
    .then( () => {
      // ipc-handler/api
      IpcApi();

      // window handlers
      SplashWindow();
      FirstRunWindow();
      MainWindow();
    })
    .catch( err => {
      log.error([ err ]);
    })
  ;
}


function handleAllClosed() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if( process.platform !== 'darwin' ) {
    app.quit();
  }
}


function handleOnActivate() {
  const windows = WindowManager.getWindows();

  if( Object.keys( windows ).length === 0 ) {
    SplashWindow();
  }
}


export default () => {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on( 'ready', handleOnReady );

  // Quit when all windows are closed.
  app.on( 'window-all-closed', handleAllClosed );

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on( 'activate', handleOnActivate );
};
