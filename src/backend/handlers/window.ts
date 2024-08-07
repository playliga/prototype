/**
 * BrowserWindow IPC handlers.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { WindowManager } from '@liga/backend/lib';
import { Constants } from '@liga/shared';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.on(Constants.IPCRoute.WINDOW_CLOSE, (_, id) => WindowManager.get(id).close());
  ipcMain.on(Constants.IPCRoute.WINDOW_OPEN, (_, id) => WindowManager.get(id));
  ipcMain.on(Constants.IPCRoute.WINDOW_SEND, (_, id: Constants.WindowIdentifier, data, delay) =>
    WindowManager.send(id, data, delay),
  );
}
