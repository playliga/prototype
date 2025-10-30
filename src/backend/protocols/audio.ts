/**
 * Audio protocol.
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
  scheme: 'audio',
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
  protocol.handle('audio', async (request) => {
    const { host, pathname } = new URL(request.url);

    // trim trailing slash since audio usually
    // do not have a parent folder
    const targetPath = path
      .join(app.getPath('userData'), 'audio', host, pathname)
      .replace(/[/\\]$/, '');

    try {
      await fs.promises.access(targetPath, fs.constants.F_OK);
      return net.fetch(url.pathToFileURL(targetPath).toString());
    } catch (_) {
      return new Response('', { status: 404 });
    }
  });
}
