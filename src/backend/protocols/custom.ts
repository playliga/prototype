/**
 * Modding and customizations protocol.
 *
 * @module
 */
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';
import { app, net, protocol } from 'electron';

/**
 * Protocol scheme definition.
 *
 * @constant
 */
export const config: Electron.CustomScheme = {
  scheme: 'custom',
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    bypassCSP: true,
    stream: true,
  },
};

/**
 * Resources custom protocol handler.
 *
 * @function
 */
export function handler() {
  protocol.handle('custom', async (request) => {
    const { host, pathname } = new URL(request.url);
    const targetPath = path.join(app.getPath('userData'), 'custom', host, pathname);

    try {
      await fs.promises.access(targetPath, fs.constants.F_OK);
      return net.fetch(url.pathToFileURL(targetPath).toString());
    } catch (_) {
      return new Response('', { status: 404 });
    }
  });
}
