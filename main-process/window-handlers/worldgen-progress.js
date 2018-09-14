// @flow
import path from 'path';
import { ipcMain } from 'electron';
import ProgressBar from 'electron-progressbar';

import { ScraperFactory } from '../../common/scraper-factory';


const CACHE_DIR = path.join( __dirname, 'cache' );

function generateFreeAgents(): Promise<Object> {
  const factoryObj = new ScraperFactory( CACHE_DIR, 'esea-csgo-freeagents' );
  return factoryObj.generate();
}

function generateTeamsAndPlayers(): Promise<Array<Object>> {
  const factoryObj = new ScraperFactory( CACHE_DIR, 'esea-csgo' );
  return factoryObj.generate();
}

export default () => {
  ipcMain.on( 'new-career', ( event: Object, data: Array<Object> ) => {
    // close the current window
    // create a new window that generates the world (season, leagues, etc)
    const win = new ProgressBar({
      text: 'Creating world.',
      detail: 'Generating free agents...',
      browserWindow: {
        titleBarStyle: 'hidden'
      }
    });

    generateFreeAgents()
      .then( ( res: Object ) => {
        win.detail = 'Generating teams and players...';
        return generateTeamsAndPlayers();
      })
      .then( ( res: Array<Object> ) => {
        console.log( res );
        win.detail = 'Generating leagues...';
      })
      .catch( err => console.log( err ) )
      .finally( () => setTimeout( () => win.setCompleted(), 5000 ) );
  });
};