// @flow
import { ipcMain } from 'electron';


function handleContinentsFetch( evt: Object, data: Object ) {
  evt.sender.send( '/database/continents', [ { foo: 'bar' } ] );
}


export default () => {
  ipcMain.on( '/database/continents', handleContinentsFetch );
};