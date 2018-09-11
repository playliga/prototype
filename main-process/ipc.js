// @flow
import { ipcMain } from 'electron';
import Models from '../database/models';


export default () => {
  // Temporary interface to the models
  ipcMain.on( 'fetch-continents', async ( event: Object ) => {
    const { Country, Continent } = Models;

    // get all the continents and their countries
    const continents = await Continent.findAll({
      include: Country
    });

    event.sender.send( 'receive-continents', JSON.stringify( continents ) );
  });
};