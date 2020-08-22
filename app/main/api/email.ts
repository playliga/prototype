import { ipcMain } from 'electron';
import * as IPCRouting from 'shared/ipc-routing';
import Worldgen from 'main/lib/worldgen';


export default function() {
  ipcMain.on( IPCRouting.Worldgen.EMAIL_INTRO, Worldgen.sendIntroEmail );
}
