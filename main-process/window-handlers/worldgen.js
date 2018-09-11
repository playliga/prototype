// @flow
import { ipcMain } from 'electron';
import ProgressBar from 'electron-progressbar';

export default () => {
  ipcMain.on( 'new-career', ( event: Object, data: Array<Object> ) => {
    // close the current window
    // create a new window that generates the world (season, leagues, etc)
    const win = new ProgressBar({
      text: 'Generating world...',
      detail: '',
      browserWindow: {
        titleBarStyle: 'hidden'
      }
    });

    setTimeout( () => win.setCompleted(), 5000 );
  });
};