// @flow
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import Database from 'main/lib/database';
import WindowManager from 'main/lib/window-manager';
import { DatabaseAPI } from 'main/app-handlers';
import { SplashWindow, MainWindow } from 'main/window-handlers';


/**
 * Needs to run before we can show any application windows. This
 * function ensures that the app always uses a source-controlled
 * snapshot of the database.
**/
function setupDB() {
  const dbpath = path.join( app.getPath( 'userData' ), 'databases' );
  const dbinstance = new Database( dbpath );
  const datastorepaths = dbinstance.datastorepaths;

  // if for whatever reason the dbpath folder does
  // not exist create it
  if( !fs.existsSync( dbpath ) ) {
    fs.mkdirSync( dbpath );
  }

  // if any of the datastore paths do not exist in the appdata
  // directory then copy them over from the resources folder
  datastorepaths.forEach( ( dspath: string ) => {
    if( !fs.existsSync( dspath ) ) {
      // copy from local resources
      // into target db path
      const dsfilename = path.basename( dspath );
      fs.copyFileSync(
        path.join( __dirname, 'resources/databases', dsfilename ),
        dspath
      );
    }
  });

  // now we can finally connect to the db
  return dbinstance.connect();
}


function handleOnReady() {
  setupDB().then( () => {
    // application handlers to be executed
    // before windows are shown.
    DatabaseAPI();

    // window handlers
    SplashWindow();
    MainWindow();
  });
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

  if( Object.keys( windows ) === 0 ) {
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
