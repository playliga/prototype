import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import minimist from 'minimist';
import { IterableObject } from 'shared/types';
import { Screen } from './types';


/**
 * Module-level variables
 *
 * These variables are stored at the module level so they can be
 * re-used as a singleton of sorts
 */
const screens: IterableObject<Screen> = {};


/**
 * Class definition
 */
export default class ScreenManager {
  static getScreens(): IterableObject<Screen> {
    return screens;
  }

  static getScreenById( id: string ): Screen {
    return screens[ id ];
  }

  static createScreen( id: string, url: string, options: object, urlOptions: object = {}): Screen {
    // if the provided screen id already exists with
    // an active handle then return that instead
    if( screens[ id ] && screens[ id ].handle ) {
      return screens[ id ];
    }

    // configure command line args
    const args = minimist( process.argv.slice( 2 ), {
      boolean: [ 'dev-console' ]
    });

    // configure default screen options which
    // can be overriden by incoming options
    const defaultoptions: BrowserWindowConstructorOptions = {
      fullscreenable: false,

      // force these preferences to `true` due to eventual
      // deprecation in newer versions of Electron
      webPreferences: {
        enableRemoteModule: true,
        nodeIntegration: true
      }
    };

    // Create the browser window.
    // https://github.com/electron/electron/blob/master/docs/api/browser-window.md
    // https://github.com/electron/electron/blob/master/docs/api/frameless-window.md
    const screen: Screen = {
      id,
      handle: new BrowserWindow({ ...defaultoptions, ...options })
    };

    screen.handle.loadURL( url, urlOptions );

    // open dev tools if provided via cli args
    if( args[ 'dev-console' ] ) {
      screen.handle.webContents.openDevTools();
    }

    // Emitted when the screen is closed.
    screen.handle.on( 'closed', () => {
      // Dereference the screen object, usually you would store screens
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      delete screen.handle;
    });

    screens[ id ] = screen;
    return screen;
  }
}
