/**
 * Blazonry IPC handlers.
 *
 * @module
 */
import path from 'node:path';
import { ipcMain } from 'electron';
import { glob } from 'glob';
import { Constants, is } from '@liga/shared';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.BLAZONRY_ALL, () =>
    glob('*.svg', {
      cwd: is.dev()
        ? path.normalize(path.join(process.env.INIT_CWD, 'src/resources/blazonry'))
        : path.join(process.resourcesPath, 'blazonry'),
    }),
  );
}
