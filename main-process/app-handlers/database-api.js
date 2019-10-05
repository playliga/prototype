// @flow
import { ipcMain } from 'electron';
import { Datastore } from 'main/lib/database';


type Query = {
  dsname: string,
  q?: Object
};


async function handleDBFetch( evt: Object, query: Query ) {
  const dsinstance = new Datastore( query.dsname );
  evt.sender.send( '/database/find', await dsinstance.find( query.q || {}) );
}


export default () => {
  ipcMain.on( '/database/find', handleDBFetch );
};