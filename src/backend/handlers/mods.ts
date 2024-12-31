/**
 * IPC handlers for the mod manager.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { Constants } from '@liga/shared';
import { Mods } from '@liga/backend/lib';

/** @constant */
const MODS_REPO_URL = 'https://github.com/playliga/mods.git';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.MODS_ALL, () => {
    const mods = new Mods.Manager(MODS_REPO_URL);
    return mods.all();
  });
  ipcMain.on(Constants.IPCRoute.MODS_DOWNLOAD, async (event, data: string) => {
    // initialize the mod manager
    const mods = new Mods.Manager(MODS_REPO_URL);

    // register event handlers
    mods.on(Mods.EventIdentifier.DOWNLOADING, () =>
      event.reply(Constants.IPCRoute.MODS_DOWNLOADING),
    );
    mods.on(Mods.EventIdentifier.DOWNLOAD_PROGRESS, (percent) =>
      event.reply(Constants.IPCRoute.MODS_DOWNLOAD_PROGRESS, percent),
    );
    mods.on(Mods.EventIdentifier.ERROR, () => event.reply(Constants.IPCRoute.MODS_ERROR));
    mods.on(Mods.EventIdentifier.FINISHED, () => event.reply(Constants.IPCRoute.MODS_FINISHED));
    mods.on(Mods.EventIdentifier.INSTALL, () => event.reply(Constants.IPCRoute.MODS_INSTALLING));

    // start the download
    await mods.download(data);
    await mods.extract();
  });
  ipcMain.handle(Constants.IPCRoute.MODS_GET_INSTALLED, Mods.Manager.getInstalledModName);
}
