import path from 'path';
import { ipcMain, Menu } from 'electron';
import is from 'electron-is';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Database from 'main/lib/database';
import WindowManager from 'main/lib/window-manager';
import { Window } from 'main/lib/window-manager/types';
import DefaultMenuTemplate, { RawDefaultMenuTemplate, MenuItems } from 'main/lib/default-menu';


// module-level variables and constants
const PORT = process.env.PORT || 3000;
const WIDTH = 300;
const HEIGHT = 400;
const CONFIG = {
  url: is.production()
    ? `file://${path.join( __dirname, 'dist/renderer/windows/splash/index.html' )}`
    : `http://localhost:${PORT}/windows/splash/index.html`,
  opts: {
    backgroundColor: '#000000',
    width: WIDTH,
    height: HEIGHT,
    frame: false,
    maximizable: false,
    resizable: false,
    movable: false,
    minimizable: false
  }
};

let win: Window;


/**
 * First run logic
 *
 * Figure out if this the first time the user runs the app. This will
 * help determine which window to redirect the user to.
 */

// @todo: the firstrun redirect logic.
let redirect_target = 'firstrun';


function checkuserdata() {
  // load the database
  // check the userdata for data
  const datastores = new Database().datastores;

  // @todo: a more thorough check
  return new Promise( resolve => {
    const res = datastores.userdata.find() as Promise<any[]>;
    res.then( d => {
      redirect_target = d.length > 0 ? 'main' : 'firstrun';
      resolve();
    });
  });
}


/**
 * Auto updater logic.
 */

// configure electron-updater logger
autoUpdater.autoDownload = false;
autoUpdater.logger = log;
// @ts-ignore
autoUpdater.logger.transports.file.level = 'debug';


// auto updater event handlers
function handleError( err: Error ) {
  win.handle.webContents.send( '/windows/splash/error', err );

  // attempt to launch the main application anyways
  setTimeout( () => {
    ipcMain.emit( `/windows/${redirect_target}/open` );
    win.handle.close();
  }, 2000 );
}


function handleCheckingUpdate() {
  // @TODO
}


function handleNoUpdateAvail() {
  win.handle.webContents.send( '/windows/splash/no-update-avail' );

  // close the splash window after 2 seconds
  // and open the main application window
  setTimeout( () => {
    ipcMain.emit( `/windows/${redirect_target}/open` );
    win.handle.close();
  }, 2000 );
}


function handleUpdateAvail() {
  if( is.production() ) {
    autoUpdater.downloadUpdate();
  }

  win.handle.webContents.send( '/windows/splash/update-avail' );
}


function handleDownloadProgress( progressObj: object ) {
  win.handle.webContents.send( '/windows/splash/download-progress', progressObj );
}


function handleUpdateDownloaded() {
  win.handle.webContents.send( '/windows/splash/update-downloaded' );

  // wait two seconds so that the GUI gets a chance
  // to show a `done` message
  setTimeout( () => {
    // if in production: quit and install the update
    if( is.production() ) {
      autoUpdater.quitAndInstall();
      return;
    }

    // otherwise, manually close this window
    // and open the main application window
    ipcMain.emit( `/windows/${redirect_target}/open` );
    win.handle.close();
  }, 2000 );
}


// fake auto-updater for development mode
function fakeAutoUpdater() {
  const FOUND_DELAY = 2000;
  const DOWNLOAD_FREQ = 500;
  const END_DOWNLOAD_DELAY = 5000;

  const PROBABILITY_MIN = 0;
  const PROBABILITY_MAX = 10;
  const NO_UPDATE_PROBABILITY_HIGH = 5;

  // generate a random number to decide whether we'll
  // fake an update or not
  const num = Math.floor( Math.random() * PROBABILITY_MAX ) + PROBABILITY_MIN;

  let ivl: NodeJS.Timeout;
  let progress = 0;

  // immediately call `handleCheckingUpdate`
  handleCheckingUpdate();

  // if we're below five then no update was found
  // send the message and bail
  if( num < NO_UPDATE_PROBABILITY_HIGH ) {
    setTimeout( () => {
      handleNoUpdateAvail();
    }, FOUND_DELAY );

    return;
  }

  // otherwise, we're going to fake that we got an update
  // after two seconds. and then begin "downloading" it
  setTimeout( () => {
    handleUpdateAvail();

    ivl = setInterval( () => {
      progress += 20;
      handleDownloadProgress({
        bytesPerSecond: 1500,
        percent: progress,
        transferred: 1500,
        total: 3000
      });
    }, DOWNLOAD_FREQ );
  }, FOUND_DELAY );

  // after a few seconds, call `handleUpdateDownloaded`
  // and cancel the above timer
  setTimeout( () => {
    clearInterval( ivl );
    handleUpdateDownloaded();
  }, END_DOWNLOAD_DELAY );
}


/**
 * Main functions
 */

function setupwindow() {
  // create the window
  win = WindowManager.createWindow( '/windows/splash', CONFIG.url, CONFIG.opts );

  // disable the menu only in prod
  if( is.production() ) {
    win.handle.setMenu( null );
  }

  // on osx it's enforced to show the Application Menu item
  // and in addition, the `setMenu` function doesn't work
  if( is.osx() ) {
    // in prod only add the application menu item
    if( is.production() ) {
      // @ts-ignore
      const m = Menu.buildFromTemplate( [ RawDefaultMenuTemplate[ MenuItems.APPNAME ] ] );
      Menu.setApplicationMenu( m );

    // otherwise, add the default menu since the `setMenu` function
    // does not work in osx
    } else {
      Menu.setApplicationMenu( DefaultMenuTemplate );
    }
  }
}


function setupautoupdater() {
  // if in production use the real auto-updater
  // otherwise use the fake one.
  if( is.production() ) {
    // @note: flip this on once auto-updating is enabled
    autoUpdater.on( 'error', handleError );
    autoUpdater.on( 'checking-for-update', handleCheckingUpdate );
    autoUpdater.on( 'update-available', handleUpdateAvail );
    autoUpdater.on( 'update-not-available', handleNoUpdateAvail );
    autoUpdater.on( 'download-progress', handleDownloadProgress );
    autoUpdater.on( 'update-downloaded', handleUpdateDownloaded );
    // autoUpdater.checkForUpdates();

    // @note: flip this off once auto-updating is enabled
    fakeAutoUpdater();
  } else {
    fakeAutoUpdater();
  }
}


export default () => {
  checkuserdata().then( () => {
    setupwindow();
    setupautoupdater();
  });
};
