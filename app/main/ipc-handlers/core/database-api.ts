import { ipcMain, IpcMainEvent } from 'electron';
import { Datastore } from 'main/lib/database';


interface Query {
  dsname: string;
  q?: object;
}


async function handleDBFetch( evt: IpcMainEvent, query: Query ) {
  const dsinstance = new Datastore( query.dsname );
  const data = await dsinstance.find( query.q || {});
  evt.sender.send( '/database/find', data );
}


export default () => {
  ipcMain.on( '/database/find', handleDBFetch );
};
