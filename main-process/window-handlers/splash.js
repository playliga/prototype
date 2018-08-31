// @flow
import path from 'path';
import { BrowserWindow } from 'electron';
import { createWindow } from '../utils';


export default ( windowList: Array<BrowserWindow> ) => {
  // Declare url and options for the main window
  const ROOT = path.join( __dirname, '../../' );

  const config = {
    URL: `file://${ROOT}/renderer-process/windows/splash/index.html`,
    OPTS: {
      titleBarStyle: 'hidden',
      backgroundColor: '#000000',
      minWidth: 800,
      minHeight: 600,
      maximizable: false
    }
  };

  const win = createWindow( config.URL, config.OPTS );
  windowList.push( win );
};