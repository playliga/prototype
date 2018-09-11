// @flow
import path from 'path';
import { ipcMain } from 'electron';
import ProgressBar from 'electron-progressbar';

import { ScraperFactory } from '../../common/scraper-factory';


function generateFreeAgents(): Promise<Object> {
  const CACHE_DIR = path.join( __dirname, 'cache' );
  const factoryObj = new ScraperFactory( CACHE_DIR, 'esea-csgo-freeagents' );

  return factoryObj.generate();
}

export default () => {
  ipcMain.on( 'new-career', ( event: Object, data: Array<Object> ) => {
    // close the current window
    // create a new window that generates the world (season, leagues, etc)
    const win = new ProgressBar({
      text: 'Creating world...',
      detail: 'Generating free agents...',
      browserWindow: {
        titleBarStyle: 'hidden'
      }
    });

    generateFreeAgents()
      .then( ( res: Object ) => {
        console.log( res );
        win.detail = 'Generating teams and players...';
      })
      .catch( err => console.log( err ) )
      .finally( () => setTimeout( () => win.setCompleted(), 5000 ) );
  });
};