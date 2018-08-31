// @flow
/* eslint-disable import/prefer-default-export */
import { BrowserWindow } from 'electron';
import minimist from 'minimist';


export function createWindow(
  url: string,
  options: Object,
  onClose: Function | void = undefined
): BrowserWindow {
  // configure command line args
  const args = minimist( process.argv.slice( 2 ), {
    boolean: [ 'dev-console' ]
  });

  // Create the browser window.
  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md
  // https://github.com/electron/electron/blob/master/docs/api/frameless-window.md
  let win = new BrowserWindow( options );
  win.loadURL( url );

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

  return win;
}