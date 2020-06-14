import { ipcMain } from 'electron';
import * as IPCRouting from 'shared/ipc-routing';
import * as Worldgen from 'main/lib/worldgen';


export default () => {
  ipcMain.on( IPCRouting.Worldgen.EMAIL_INTRO, Worldgen.sendIntroEmail );
};
