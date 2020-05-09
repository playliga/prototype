import { ipcMain } from 'electron';
import * as Worldgen from 'main/lib/worldgen';


export default () => {
  ipcMain.on( '/worldgen/email/intro', Worldgen.sendIntroEmail );
};
