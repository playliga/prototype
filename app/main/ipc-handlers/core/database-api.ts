import { ipcMain, IpcMainEvent } from 'electron';


interface Query {
  dsname: string;
  q?: object;
}


async function handleDBFetch( evt: IpcMainEvent, query: Query ) {
  evt.sender.send( '/database/find', [] );
}


export default () => {
  ipcMain.on( '/database/find', handleDBFetch );
};
