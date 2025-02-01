/**
 * The application's main entrypoint.
 *
 * @module
 */
import * as Sqrl from 'squirrelly';
import * as IPCHandlers from '@liga/backend/handlers';
import * as Protocols from '@liga/backend/protocols';
import is from 'electron-is';
import log from 'electron-log';
import { app, protocol, BrowserWindow } from 'electron';
import { Constants, Util } from '@liga/shared';
import { DatabaseClient, WindowManager } from '@liga/backend/lib';

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 *
 * Some APIs can only be used after this event occurs.
 *
 * @function
 */
async function handleOnReady() {
  // @todo: remove after beta
  try {
    await DatabaseClient.patchForChromium();
  } catch (error) {
    log.warn(error);
  }

  // register all ipc handlers
  Object.values(IPCHandlers).forEach((handler) => handler());

  // register all protocol handlers
  Object.values(Protocols).forEach((protocol) => protocol.handler());

  // create initial splash window
  WindowManager.get(WindowManager.WINDOW_CONFIGS.splash.id);
}

/**
 * Quit when all windows are closed, except on macOS.
 *
 * There, it's common for applications and their
 * menu bar to stay active until the user quits
 * explicitly with Cmd + Q.
 *
 * @function
 */
function handleAllClosed() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}

/**
 * On OS X it's common to re-create a window in the app when the
 * dock icon is clicked and there are no other windows open.
 *
 * @function
 */
function handleOnActivate() {
  if (BrowserWindow.getAllWindows().length === 0) {
    WindowManager.get(WindowManager.WINDOW_CONFIGS.main.id);
  }
}

/**
 * Self-invoking bootstrapping logic.
 *
 * @function anonymous
 */
(async () => {
  // stop squirrel from launching multiple instances of
  // the app when installing, updating or uninstalling
  //
  // @see https://www.electronforge.io/config/makers/squirrel.windows#handling-startup-events
  if (require('electron-squirrel-startup')) {
    app.quit();
  }

  // control logging level via environment variable.
  if (process.env.LOG_LEVEL) {
    log.transports.console.level = process.env.LOG_LEVEL as log.LevelOption;
    log.transports.file.level = process.env.LOG_LEVEL as log.LevelOption;
  } else if (is.production()) {
    log.transports.console.level = Constants.Application.LOGGING_LEVEL as log.LevelOption;
    log.transports.file.level = Constants.Application.LOGGING_LEVEL as log.LevelOption;
  }

  // set up squirrelly custom filters
  Sqrl.filters.define('currency', Util.formatCurrency);

  // disable insecure warnings in dev since
  // we use HMR and it only supports http
  if (is.dev()) {
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
  }

  // register custom protocols which must
  // be done before app is ready
  protocol.registerSchemesAsPrivileged(Object.values(Protocols).map((protocol) => protocol.config));

  // handle window lifecycle events
  app.on('ready', handleOnReady);
  app.on('window-all-closed', handleAllClosed);
  app.on('activate', handleOnActivate);
})();
