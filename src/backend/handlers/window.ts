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
  ipcMain.on(Constants.IPCRoute.WINDOW_SEND, (_, id: string, data) => {
    const win = WindowManager.get(id);
    win.once('ready-to-show', () => win.webContents.send(Constants.IPCRoute.WINDOW_SEND, data));
  });
}
