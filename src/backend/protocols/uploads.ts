/**
 * User uploads protocol.
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
  scheme: 'uploads',
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
  protocol.handle('uploads', async (request) => {
    const { host, pathname } = new URL(request.url);

    // trim trailing slash since uploads usually do not have a parent
    // folder and url-decode it since the constructor above encodes
    // it which breaks when accessing it on the filesystem
    const targetPath = decodeURI(
      path.join(app.getPath('userData'), 'uploads', host, pathname).replace(/[/\\]$/, ''),
    );

    try {
      await fs.promises.access(targetPath, fs.constants.F_OK);
      return net.fetch(url.pathToFileURL(targetPath).toString());
    } catch (_) {
      return new Response('', { status: 404 });
    }
  });
}
