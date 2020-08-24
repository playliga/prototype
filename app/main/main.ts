import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import log from 'electron-log';
import is from 'electron-is';
import { Sequelize } from 'sequelize';

import * as Models from 'main/database/models';
import * as IPCApis from 'main/api';
import * as Screens from 'main/screens';
import Application from 'main/constants/application';
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

function setupDB() {
  const dbpath = path.join( app.getPath( 'userData' ), 'databases' );
  const targetpath = path.join( dbpath, Application.DB_NAME );

  // copy source-controlled db if not found
  if( !fs.existsSync( targetpath ) ) {
    const localpath = path.join( __dirname, 'resources/databases', Application.DB_NAME );

    // create parent folder if not found
    if( !fs.existsSync( dbpath ) ) {
      fs.mkdirSync( dbpath );
    }

    // copy over the local copy
    if( fs.existsSync( localpath ) ) {
      fs.copyFileSync( localpath, targetpath );
    }
  }

  // turn off logging in production
  // to improve performance
  const loggingfunc = is.production()
    ? false
    : ( msg: string ) => log.debug( msg )
  ;

  // configure the connection pool
  const poolconfig = is.production()
    ? {
      max: Application.DB_CNX_LIMIT,
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
