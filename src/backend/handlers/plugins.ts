/**
 * IPC handlers for the plugins manager.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { Constants } from '@liga/shared';
import { Plugins } from '@liga/backend/lib';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.on(Constants.IPCRoute.PLUGINS_START, (event) => {
    // start checking for updates
    // @todo: do not hardcode the url
    const plugins = new Plugins.Manager('https://github.com/playliga/plugins.git');
    plugins.checkForUpdates();

    // register plugin manager event handlers
    plugins.on(Plugins.EventIdentifier.CHECKING, () =>
      event.reply(Constants.IPCRoute.PLUGINS_CHECKING),
    );
    plugins.on(Plugins.EventIdentifier.NO_UPDATE, () =>
      event.reply(Constants.IPCRoute.PLUGINS_NO_UPDATE),
    );
    plugins.on(Plugins.EventIdentifier.DOWNLOADING, () =>
      event.reply(Constants.IPCRoute.PLUGINS_DOWNLOADING),
    );
    plugins.on(Plugins.EventIdentifier.DOWNLOAD_PROGRESS, (percent) =>
      event.reply(Constants.IPCRoute.PLUGINS_DOWNLOAD_PROGRESS, percent),
    );
    plugins.on(Plugins.EventIdentifier.ERROR, () => event.reply(Constants.IPCRoute.PLUGINS_ERROR));
    plugins.on(Plugins.EventIdentifier.FINISHED, () =>
      event.reply(Constants.IPCRoute.PLUGINS_FINISHED),
    );
    plugins.on(Plugins.EventIdentifier.INSTALL, () =>
      event.reply(Constants.IPCRoute.PLUGINS_INSTALLING),
    );
  });
}
