// @flow
import path from 'path';
import { ipcMain, Menu } from 'electron';
import is from 'electron-is';
import WindowManager from 'main/lib/window-manager';
import DefaultMenuTemplate from 'main/lib/default-menu';


// @TODO
// This should be coming in from another module
const ISFIRSTRUN = true;

// module-level variables and constants
const PORT = process.env.PORT || 3000;
const WIDTH = 800;
const HEIGHT = 600;
const CONFIG = {
  url: is.production()
    ? `file://${path.join( __dirname, `dist/renderer/windows/main/index.html?firstrun=${ISFIRSTRUN.toString()}` )}`
    : `http://localhost:${PORT}/windows/main/index.html?firstrun=${ISFIRSTRUN.toString()}`,
  opts: {
    backgroundColor: '#f5f5f5', // "whitesmoke"
    width: WIDTH,
    height: HEIGHT,
    minWidth: WIDTH,
    minHeight: HEIGHT
  }
};


// ipc handlers
function openWindowHandler( evt: Object, data: Object ) {
  const win = WindowManager.createWindow( '/windows/main', CONFIG.url, CONFIG.opts );
  win.handle.setMenu( DefaultMenuTemplate );

  // the `setMenu` function above doesn't work on
  // osx so we'll have to accomodate for that
  if( is.osx() ) {
    Menu.setApplicationMenu( DefaultMenuTemplate );
  }
}


function saveFirstRunHandler( evt: Object, data: Object ) {
  console.log( data );
}


export default () => {
  // ipc listeners
  ipcMain.on( '/windows/main/open', openWindowHandler );
  ipcMain.on( '/windows/main/firstrun/save', saveFirstRunHandler );
};