import path from 'path';
import { ipcMain, Menu } from 'electron';
import is from 'electron-is';
import * as IPCRouting from 'shared/ipc-routing';
import ScreenManager from 'main/lib/screen-manager';
import DefaultMenuTemplate from 'main/lib/default-menu';


// module-level variables and constants
const PORT = process.env.PORT || 3000;
const WIDTH = 1024;
const HEIGHT = 768;
const CONFIG = {
  url: is.production()
    ? `file://${path.join( __dirname, 'dist/renderer/screens/main/index.html' )}`
    : `http://localhost:${PORT}/screens/main/index.html`,
  opts: {
    backgroundColor: '#f5f5f5', // "whitesmoke"
    width: WIDTH,
    height: HEIGHT,
    minWidth: WIDTH,
    minHeight: HEIGHT,
    icon: path.join( __dirname, 'resources/icon.png' )
  }
};


/**
 * Screen IPC handlers
 */

async function openWindowHandler() {
  const screen = ScreenManager.createScreen( IPCRouting.Main._ID, CONFIG.url, CONFIG.opts );
  screen.handle.setMenu( DefaultMenuTemplate );

  // the `setMenu` function above doesn't work on
  // osx so we'll have to accomodate for that
  if( is.osx() ) {
    Menu.setApplicationMenu( DefaultMenuTemplate );
  }
}


export default () => {
  // ipc listeners
  ipcMain.on( IPCRouting.Main.OPEN, openWindowHandler );
};
