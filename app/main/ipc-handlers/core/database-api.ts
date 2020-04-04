import { ipcMain, IpcMainEvent } from 'electron';
import Database from 'main/database';


interface Query {
  dsname: string;
  q?: object;
}


async function handleDBFetch( evt: IpcMainEvent, query: Query ) {
  const datastores = Database.datastores;
  const data = await datastores[ query.dsname ].find( query.q || {});
  evt.sender.send( '/database/find', data );
}


export default () => {
  ipcMain.on( '/database/find', handleDBFetch );
};
