/**
 * Manages a local file system cache of fetch requests.
 *
 * @note
 * This module only supports JSON request types.
 *
 * @note
 * This module must be imported directly when
 * used outside of the context of Electron.
 *
 * @module
 */
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import log from 'electron-log';
import AppInfo from 'package.json';

/**
 * Initializes the cache directory by creating it
 * if it doesn't already exist in the filesystem.
 *
 * @function
 */
async function initCacheDirectory() {
  const cacheDir = path.join(os.tmpdir(), AppInfo.name);

  try {
    await fs.promises.access(cacheDir, fs.constants.F_OK);
  } catch (error) {
    await fs.promises.mkdir(cacheDir);
  }

  return Promise.resolve(cacheDir);
}

/**
 * Intercepts a standard fetch request and returns its content
 * from cache. If nothing is found, fetches the live
 * data and then creates the cache entry.
 *
 * @param url   The request URL.
 * @param opts  The request options.
 * @function
 */
export async function get(url: RequestInfo, opts?: RequestInit) {
  // generate hash of url
  const sha = crypto
    .createHash('sha256')
    .update(url as string)
    .digest('hex');

  // does it exist in filesystem?
  const cacheDir = await initCacheDirectory();
  const file = path.join(cacheDir, sha);

  try {
    // try to read from cache
    await fs.promises.access(file, fs.constants.F_OK);
    log.info('Cache hit for: %s', file);

    // that didn't fail, so read from cache and return
    const data = await fs.promises.readFile(file, 'utf-8');
    return Promise.resolve(JSON.parse(data));
  } catch (error) {
    // that failed so continue and fetch the live data
    log.warn('Cache miss for: %s', file);
  }

  // fetch the live data
  let data: unknown;

  try {
    const resp = await fetch(url, opts);
    data = await resp.json();
  } catch (error) {
    log.error(error);
    return Promise.reject(error);
  }

  // write it to cache and return
  log.info('Writing cache to: %s', file);
  await fs.promises.writeFile(file, JSON.stringify(data));
  return Promise.resolve(data);
}
