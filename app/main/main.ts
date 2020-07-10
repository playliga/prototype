import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import log from 'electron-log';
import is from 'electron-is';
import { Sequelize } from 'sequelize';

import * as Models from 'main/database/models';
import * as IPCApis from 'main/api';
import * as Screens from 'main/screens';
import ScreenManager from 'main/lib/screen-manager';


/**
 * disable insecure warnings in dev since we
 * use HMR and it only supports http
 */

if( is.dev() ) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}


/**
 * Set-up the application database
 */

const DBNAME    = 'save0.sqlite';
const DBPATH    = path.join( app.getPath( 'userData' ), 'databases' );


function setupDB() {
  const targetpath = path.join( DBPATH, DBNAME );

  // copy source-controlled db if not found
  if( !fs.existsSync( targetpath ) ) {
    const localpath = path.join( __dirname, 'resources/databases', DBNAME );

    // create parent folder if not found
    if( !fs.existsSync( DBPATH ) ) {
      fs.mkdirSync( DBPATH );
    }

    // copy over the local copy
    if( fs.existsSync( localpath ) ) {
      fs.copyFileSync( localpath, targetpath );
    }
  }

  // configure sequelize logging
  const loggingfunc = is.production()
    ? log.debug.bind( log )
    : ( msg: string ) => log.debug( msg )
  ;

  // configure the connection pool
  const poolconfig = is.production()
    ? {
      max: 50,
      min: 0,
    } : undefined
  ;

  // configure the sequelize cnx
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: targetpath,
    logging: loggingfunc,
    pool: poolconfig
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


/**
 * Set up the application IPC listeners
 */
function setupIPCListeners() {
  Object
    .values( IPCApis )
    .forEach( ipc => ipc() )
  ;
}


function handleOnReady() {
  // setup source-controlled snapshots
  setupDB()
    .then( () => {
      // ipc-handler/api
      setupIPCListeners();

      // screen handlers
      Screens.SplashScreen();
      Screens.FirstRunScreen();
      Screens.MainScreen();
      Screens.OfferScreen();

      // @note: this fixes the sequelize/bluebird warning about unhandled promises
      //
      // https://github.com/sequelize/sequelize/issues/4883#issuecomment-198131826
      return null;
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
  const screens = ScreenManager.getScreens();

  if( Object.keys( screens ).length === 0 ) {
    Screens.SplashScreen();
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
