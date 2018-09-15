// @flow
import path from 'path';
import { ipcMain } from 'electron';
import ProgressBar from 'electron-progressbar';
import { ScraperFactory } from '../../common/scraper-factory';

import type { Regions as ESEA_CSGO_Regions } from '../../common/scraper-factory/scrapers/esea-csgo';
import type { Regions as ESEA_CSGO_FA_Regions } from '../../common/scraper-factory/scrapers/esea-csgo-freeagents';


const CACHE_DIR = path.join( __dirname, 'cache' );
const WIN_OPTS = {
  text: 'Creating world.',
  detail: 'Generating free agents...',
  browserWindow: {
    titleBarStyle: 'hidden'
  }
};

function generateFreeAgents(): Promise<ESEA_CSGO_FA_Regions> {
  return new ScraperFactory(
    CACHE_DIR, 'esea-csgo-freeagents'
  ).generate();
}

function generateTeamsAndPlayers(): Promise<Array<ESEA_CSGO_Regions>> {
  return new ScraperFactory(
    CACHE_DIR, 'esea-csgo'
  ).generate();
}

function ipcHandler( event: Object, data: Array<Object> ): void {
  // close the current window
  // create a new window that generates the world (season, leagues, etc)
  const win = new ProgressBar( WIN_OPTS );

  generateFreeAgents()
    .then( ( res: ESEA_CSGO_FA_Regions ) => {
      win.detail = 'Generating teams and players...';
      return generateTeamsAndPlayers();
    })
    .then( ( res: Array<ESEA_CSGO_Regions> ) => {
      console.log( res );
      win.detail = 'Generating leagues...';
    })
    .catch( err => console.log( err ) )
    .finally( () => setTimeout( () => win.setCompleted(), 5000 ) );
}

export default () => {
  ipcMain.on( 'new-career', ipcHandler );
};