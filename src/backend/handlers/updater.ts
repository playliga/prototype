/**
 * IPC handlers for interfacing with Electron's auto-updater.
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/updates
 * @module
 */
import log from 'electron-log';
import is from 'electron-is';
import AppInfo from 'package.json';
import { app, autoUpdater, ipcMain } from 'electron';
import { Constants } from '@liga/shared';

/**
 * Repo information extracted from the package info file.
 *
 * @constant
 */
const repoInfo = AppInfo.homepage.match(/github\.com\/(?<owner>\w+)\/(?<repo>.+)/);

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.on(Constants.IPCRoute.UPDATER_INSTALL, () => autoUpdater.quitAndInstall());

  ipcMain.on(Constants.IPCRoute.UPDATER_START, (event) => {
    // bail early if we're in dev mode
    if (is.dev()) {
      event.reply(Constants.IPCRoute.UPDATER_NO_UPDATE);
      return;
    }

    // configures the auto updater to use the public releases
    // repo rather than the default which is private
    autoUpdater.setFeedURL({
      url:
        'https://update.electronjs.org/' +
        `${repoInfo.groups.owner}/${repoInfo.groups.repo.toLowerCase()}-public/` +
        `${process.platform}-${process.arch}/${app.getVersion()}`,
    });

    // start checking for updates
    log.info('Checking for updates: %s', autoUpdater.getFeedURL());
    autoUpdater.checkForUpdates();

    // register the auto updater event handlers
    autoUpdater.on('checking-for-update', () => event.reply(Constants.IPCRoute.UPDATER_CHECKING));
    autoUpdater.on('update-not-available', () => event.reply(Constants.IPCRoute.UPDATER_NO_UPDATE));
    autoUpdater.on('update-available', () => event.reply(Constants.IPCRoute.UPDATER_DOWNLOADING));
    autoUpdater.on('update-downloaded', () => event.reply(Constants.IPCRoute.UPDATER_FINISHED));

    // error event handler
    autoUpdater.on('error', (message) => {
      log.error(message);
      event.reply(Constants.IPCRoute.UPDATER_NO_UPDATE);
    });
  });
}
