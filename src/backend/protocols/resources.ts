/**
 * Resources protocol.
 *
 * @module
 */
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';
import { net, protocol } from 'electron';
import { is } from '@liga/shared';

/**
 * Protocol scheme definition.
 *
 * @constant
 */
export const config: Electron.CustomScheme = {
  scheme: 'resources',
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    bypassCSP: true,
    stream: true,
  },
};

/**
 * Resources protocol handler.
 *
 * @function
 */
export function handler() {
  const resourcesPath = is.dev()
    ? path.normalize(path.join(process.env.INIT_CWD, 'src/resources'))
    : process.resourcesPath;

  protocol.handle('resources', async (request) => {
    const { host, pathname } = new URL(request.url);
    const targetPath = path.join(resourcesPath, host, pathname);

    try {
      await fs.promises.access(targetPath, fs.constants.F_OK);
      return net.fetch(url.pathToFileURL(targetPath).toString());
    } catch (_) {
      return new Response('', { status: 404 });
    }
  });
}
