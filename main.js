// @flow
import { app, BrowserWindow } from 'electron';
import minimist from 'minimist';


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windowList: Array<Object> = [];

// configure command line args
const args = minimist( process.argv.slice( 2 ), {
  boolean: [ 'dev-console' ]
});

function createWindow(): Object {
  // Create the browser window.
  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md
  // https://github.com/electron/electron/blob/master/docs/api/frameless-window.md
  let win = new BrowserWindow({
    titleBarStyle: 'hidden',
    backgroundColor: '#000000',
    minWidth: 800,
    minHeight: 600,
    maximizable: false
  });

  // and load the index.html of the app
  win.loadURL( `file://${__dirname}/renderer-process/windows/splash/index.html` );

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on( 'ready', () => {
  windowList.push( createWindow() );
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
  if( windowList.length === 0 ) {
    windowList.push( createWindow() );
  }
});
