/**
 * Generic IPC handlers.
 *
 * @module
 */
import fs from 'node:fs';
import path from 'node:path';
import is from 'electron-is';
import AppInfo from 'package.json';
import { app, dialog, ipcMain } from 'electron';
import { Constants } from '@liga/shared';
import { DatabaseClient, WindowManager } from '@liga/backend/lib';

export { default as IPCDatabaseHandler } from './database';
export { default as IPCWIndowHandler } from './window';
export { default as IPCBlazonryHandler } from './blazonry';
export { default as IPCUpdaterHandler } from './updater';
export { default as IPCCalendarHandler } from './calendar';
export { default as IPCMatchHandler } from './match';
export { default as IPCPlayHandler } from './play';
export { default as IPCProfileHandler } from './profile';
export { default as IPCTransferHandler } from './transfer';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export function IPCGenericHandler() {
  ipcMain.handle(Constants.IPCRoute.APP_INFO, () =>
    Promise.resolve({
      name: is.production() ? app.getName() : AppInfo.productName,
      version: is.production() ? app.getVersion() : AppInfo.version,
    }),
  );

  ipcMain.handle(
    Constants.IPCRoute.APP_DIALOG,
    (_, parentId: string, options: Electron.OpenDialogOptions) =>
      dialog.showOpenDialog(WindowManager.get(parentId), options),
  );

  // runs app and system checks and returns any errors
  ipcMain.handle(Constants.IPCRoute.APP_STATUS, async () => {
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const settings = JSON.parse(profile.settings) as typeof Constants.Settings;
    const steamPath = path.join(settings.general.steamPath, Constants.GameSettings.STEAM_EXE);
    const gamePath = (() => {
      switch (settings.general.game) {
        case Constants.Game.CS16:
          return path.join(
            settings.general.gamePath,
            Constants.GameSettings.CS16_BASEDIR,
            Constants.GameSettings.CS16_EXE,
          );
        case Constants.Game.CSS:
          return path.join(
            settings.general.gamePath,
            Constants.GameSettings.CSSOURCE_BASEDIR,
            Constants.GameSettings.CSSOURCE_EXE,
          );
        default:
          return path.join(
            settings.general.gamePath,
            Constants.GameSettings.CSGO_BASEDIR,
            Constants.GameSettings.CSGO_EXE,
          );
      }
    })();

    try {
      await fs.promises.access(steamPath, fs.constants.F_OK);
      await fs.promises.access(gamePath, fs.constants.F_OK);
      return Promise.resolve();
    } catch (error) {
      return Promise.resolve(error.message);
    }
  });
}
