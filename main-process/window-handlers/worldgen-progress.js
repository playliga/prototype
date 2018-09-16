// @flow
import path from 'path';
import { ipcMain } from 'electron';
import ProgressBar from 'electron-progressbar';
import Models from '../../database/models';
import { ScraperFactory } from '../../common/scraper-factory';

import type {
  Regions as ESEA_CSGO_Regions,
} from '../../common/scraper-factory/scrapers/esea-csgo';
import type {
  Regions as ESEA_CSGO_FA_Regions,
  Player as ESEA_CSGO_FA_Player
} from '../../common/scraper-factory/scrapers/esea-csgo-freeagents';


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

async function saveFreeAgents( regions: ESEA_CSGO_FA_Regions ): Promise<any> {
  // fetch all registered countries from the DB
  const { Country, Player, Meta } = Models;
  const countries = await Country.findAll();

  // we've got a list of free agents separated by
  // regions (currently only NA and EU)
  const { NA } = regions;

  // loop through the NA players and add them to the database
  // collect into an array of promises
  const regionpromises = NA.map( async ( player: ESEA_CSGO_FA_Player ) => {
    // create the initial player object
    const playerObj = await Player.create({
      username: player.username,
      transferValue: player.transferValue
    });

    // add the player's country (if found)
    const countryObj = countries.find( country => country.code === player.countryCode );

    if( countryObj ) {
      playerObj.setCountry( countryObj );
    }

    // anything that isn't the below fields is a metadata
    // field that needs to be registered with the DB first
    const keys = Object.keys( player ).filter( ( key: string ) => (
      key !== 'id'
      && key !== 'username'
      && key !== 'transferValue'
      && key !== 'countryCode'
      && key !== 'teamId'
    ) );

    // store all the promises in an array as well
    // return later on
    const metapromises = keys.map( async ( key: string ) => {
      // if the metadata field exists return it
      let metaObj = await Meta.findAll({
        where: { name: key }
      });

      // otherwise create it
      if( !metaObj ) {
        metaObj = await Meta.create({ name: key });
      }

      return playerObj.addMeta( metaObj, {
        through: { // $FlowSkip
          value: player[ key ]
        }
      });
    });

    // return only after all metadata promises
    // have resolved
    return Promise.all( metapromises );
  });

  // return after all regions' promises
  // have resolved
  return Promise.all( regionpromises );
}

async function ipcHandler( event: Object, data: Array<Object> ) {
  // create a new window that shows the world gen progress
  // to the user
  const win = new ProgressBar( WIN_OPTS );

  generateFreeAgents()
    .then( ( regions: ESEA_CSGO_FA_Regions ) => {
      win.detail = 'Saving free agents to database...';
      return saveFreeAgents( regions );
    })
    .then( () => {
      win.detail = 'Generating teams and players...';
      return generateTeamsAndPlayers();
    })
    .then( ( res: Array<ESEA_CSGO_Regions> ) => {
      win.detail = 'Generating leagues...';
    })
    .catch( ( err: Error ) => {
      console.log( err );
    })
    .finally( () => {
      setTimeout( () => win.setCompleted(), 5000 );
    });
}

export default () => {
  ipcMain.on( 'new-career', ipcHandler );
};