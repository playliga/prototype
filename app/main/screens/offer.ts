import path from 'path';
import { ipcMain, Menu, IpcMainEvent } from 'electron';
import is from 'electron-is';
import { IpcRequest } from 'shared/types';
import { Screen } from 'main/lib/screen-manager/types';
import ScreenManager from 'main/lib/screen-manager';
import DefaultMenuTemplate from 'main/lib/default-menu';


// module-level variables and constants
let screen: Screen;
let data: any;


const SCREEN_ID = 'offer';
const PORT = process.env.PORT || 3000;
const WIDTH = 600;
const HEIGHT = 480;
const CONFIG = {
  url: is.production()
    ? `file://${path.join( __dirname, `dist/renderer/screens/${SCREEN_ID}/index.html` )}`
    : `http://localhost:${PORT}/screens/${SCREEN_ID}/index.html`,
  opts: {
    backgroundColor: '#f5f5f5', // "whitesmoke"
    width: WIDTH,
    height: HEIGHT,
    minWidth: WIDTH,
    minHeight: HEIGHT,
    maximizable: false,
    resizable: false,
    movable: false,
    minimizable: false
  }
};


/**
 * Screen IPC handlers
 */

async function openWindowHandler( evt: IpcMainEvent, requestdata: any ) {
  // this will be used later in order to
  // pass the data back to the modal
  data = requestdata;

  // our parent is the main screen
  const MainScreen = ScreenManager.getScreenById( '/screens/main' );

  // attach parent to the default opts
  const opts = {
    ...CONFIG.opts,
    parent: MainScreen.handle,
    modal: true
  };

  screen = ScreenManager.createScreen( `/screens/${SCREEN_ID}`, CONFIG.url, opts );
  screen.handle.setMenu( DefaultMenuTemplate );

  // the `setMenu` function above doesn't work on
  // osx so we'll have to accomodate for that
  if( is.osx() ) {
    Menu.setApplicationMenu( DefaultMenuTemplate );
  }
}


function getDataHandler( evt: IpcMainEvent, request: IpcRequest<any> ) {
  evt.sender.send( request?.responsechannel || '', JSON.stringify( data ) );
}


function closeWindowHandler() {
  screen.handle.close();
}


export default () => {
  // ipc listeners
  ipcMain.on( `/screens/${SCREEN_ID}/open`, openWindowHandler );
  ipcMain.on( `/screens/${SCREEN_ID}/getdata`, getDataHandler );
  ipcMain.on( `/screens/${SCREEN_ID}/close`, closeWindowHandler );
};
