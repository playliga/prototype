/**
 * Generic IPC handlers.
 *
 * @module
 */
import fs from 'node:fs';
import path from 'node:path';
import AppInfo from 'package.json';
import { app, dialog, ipcMain, shell } from 'electron';
import { Constants, Util, is } from '@liga/shared';
import {
  DatabaseClient,
  FileManager,
  Game,
  Plugins,
  WindowManager,
  getLocale,
} from '@liga/backend/lib';

export { default as IPCDatabaseHandler } from './database';
export { default as IPCWIndowHandler } from './window';
export { default as IPCBlazonryHandler } from './blazonry';
export { default as IPCUpdaterHandler } from './updater';
export { default as IPCCalendarHandler } from './calendar';
export { default as IPCMatchHandler } from './match';
export { default as IPCPlayHandler } from './play';
export { default as IPCProfileHandler } from './profile';
export { default as IPCTransferHandler } from './transfer';
export { default as IPCIssuesHandler } from './issues';
export { default as IPCPluginsHandler } from './plugins';
export { default as IPCModsHandler } from './mods';
export { default as IPCSponsorsHandler } from './sponsors';
export { default as IPCMapPool } from './map-pool';
export { default as IPCShortlist } from './shortlist';

/**
 * Gets application information such as name and
 * version according to the runtime context.
 *
 * @function
 */
function getApplicationInfo() {
  return {
    name: is.production() ? app.getName() : AppInfo.productName,
    version: is.production() ? app.getVersion() : AppInfo.version,
  };
}

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export function IPCGenericHandler() {
  ipcMain.handle(Constants.IPCRoute.APP_DETECT_GAME, async (_, game: Constants.Game) => {
    try {
      const gamePath = await Game.discoverGamePath(game);
      return gamePath;
    } catch (_) {
      return false;
    }
  });
  ipcMain.handle(Constants.IPCRoute.APP_DETECT_STEAM, async () => {
    try {
      const steamPath = await Game.discoverSteamPath();
      return steamPath;
    } catch (_) {
      return false;
    }
  });
  ipcMain.handle(
    Constants.IPCRoute.APP_DIALOG,
    (_, parentId: string, options: Electron.OpenDialogOptions) =>
      dialog.showOpenDialog(WindowManager.get(parentId), options),
  );
  ipcMain.handle(
    Constants.IPCRoute.APP_MESSAGE_BOX,
    (_, parentId: string, options: Electron.MessageBoxOptions) =>
      dialog.showMessageBox(WindowManager.get(parentId), options),
  );
  ipcMain.handle(Constants.IPCRoute.APP_EXTERNAL, (_, url: string) => shell.openExternal(url));
  ipcMain.handle(Constants.IPCRoute.APP_INFO, () => Promise.resolve(getApplicationInfo()));
  ipcMain.handle(Constants.IPCRoute.APP_LOCALE, async () => {
    const profile = await DatabaseClient.prisma.profile.findFirst();
    return getLocale(profile);
  });
  ipcMain.handle(Constants.IPCRoute.APP_QUIT, () => app.quit());
  ipcMain.handle(Constants.IPCRoute.APP_STATUS, async (_, settings: typeof Constants.Settings) => {
    if (!settings) {
      const profile = await DatabaseClient.prisma.profile.findFirst();
      settings = Util.loadSettings(profile.settings);
    }

    const steamPath = path.join(settings.general.steamPath || '', Constants.GameSettings.STEAM_EXE);
    const gamePath = Game.getGameExecutable(settings.general.game, settings.general.gamePath || '');

    try {
      await fs.promises.access(steamPath, fs.constants.F_OK);
      await fs.promises.access(gamePath, fs.constants.F_OK);
      await fs.promises.access(Plugins.getPath(), fs.constants.F_OK);
      await Game.isRunningAndThrow(gamePath);
      return Promise.resolve();
    } catch (error) {
      return Promise.resolve(JSON.stringify(error));
    }
  });
  ipcMain.handle(Constants.IPCRoute.APP_UPLOAD, async (_, file: string) => {
    const from = path.normalize(file);
    const to = path.join(app.getPath('userData'), 'uploads', path.basename(file));

    try {
      await FileManager.touch(to);
      await fs.promises.copyFile(from, to);
      return path.basename(to);
    } catch (error) {
      return error;
    }
  });
  ipcMain.handle(Constants.IPCRoute.APP_WHATS_NEW, async () => {
    // grab what's new file path
    const resourcesPath = is.dev()
      ? path.normalize(path.join(process.env.INIT_CWD, 'src/resources'))
      : process.resourcesPath;
    const whatsNewFile = path.join(path.join(resourcesPath, 'markdown/whats-new/whats-new.md'));

    // bail if the what's new file does not exist
    try {
      await fs.promises.access(whatsNewFile, fs.constants.F_OK);
    } catch (_) {
      return Promise.resolve();
    }

    // get the semver string from the what's new file
    const whatsNewContent = await fs.promises.readFile(whatsNewFile, 'utf8');
    const [whatsNewVersion] = whatsNewContent.split('\n')[0].match(/(v.+)/g);

    // grab last seen version
    const lastSeenVersionFilePath = path.join(app.getPath('userData'), 'LastSeenVersion');
    await FileManager.touch(lastSeenVersionFilePath);
    const lastSeenVersion = await fs.promises.readFile(lastSeenVersionFilePath, 'utf8');

    // nothing to do if the versions match
    if (whatsNewVersion === lastSeenVersion) {
      return Promise.resolve();
    }

    // show the what's new modal and
    // update the last seen version
    WindowManager.send(Constants.WindowIdentifier.Modal, { target: '/markdown/whats-new' });
    return fs.promises.writeFile(lastSeenVersionFilePath, whatsNewVersion, 'utf8');
  });
}
