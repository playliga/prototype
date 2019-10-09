import { BrowserWindow } from 'electron';
import minimist from 'minimist';
import { Windows, Window } from './types';


/**
 * Module-level variables
 *
 * These variables are stored at the module level so they can be
 * re-used as a singleton of sorts
 */
const windows: Windows = {};


/**
 * Class definition
 */
export default class WindowManager {
  static getWindows(): Windows {
    return windows;
  }

  static getWindowById( id: string ): Window {
    return windows[ id ];
  }

  static createWindow( id: string, url: string, options: object, urlOptions: object = {}): Window {
    // if the specified provided window id already
    // exists with an active handle then return that instead
    if( windows[ id ] && windows[ id ].handle ) {
      return windows[ id ];
    }

    // configure command line args
    const args = minimist( process.argv.slice( 2 ), {
      boolean: [ 'dev-console' ]
    });

    // configure default window options which
    // can be overriden by incoming options
    const defaultoptions = {
      fullscreenable: false,

      // force `nodeIntegration` to true due to deprecation
      // in Electron 5.0 API.
      // see: https://bit.ly/2B7no8d
      webPreferences: {
        nodeIntegration: true
      }
    };

    // Create the browser window.
    // https://github.com/electron/electron/blob/master/docs/api/browser-window.md
    // https://github.com/electron/electron/blob/master/docs/api/frameless-window.md
    const window: Window = {
      id,
      handle: new BrowserWindow({ ...defaultoptions, ...options })
    };

    window.handle.loadURL( url, urlOptions );

    // open dev tools if provided via cli args
    if( args[ 'dev-console' ] ) {
      window.handle.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    window.handle.on( 'closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      delete window.handle;
    });

    windows[ id ] = window;
    return window;
  }
}
