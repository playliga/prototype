/**
 * Game plugin manager.
 *
 * @module
 */
import * as GitHub from './github';
import path from 'node:path';
import fs from 'node:fs';
import AppInfo from 'package.json';
import { pipeline } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'node:stream';
import { extract } from './file-manager';

/**
 * Gets the base path to the plugins folder.
 *
 * @todo add macos support
 * @function
 */
export function getPath() {
  return path.join(process.env.APPDATA, AppInfo.productName, 'plugins');
}

/**
 * Initializes the plugins folder in the user data folder.
 *
 * @function
 */
export async function init() {
  try {
    await fs.promises.access(getPath(), fs.constants.F_OK);
    return Promise.resolve();
  } catch (error) {
    await fs.promises.mkdir(getPath(), { recursive: true });
  }
}

/**
 * Downloads the plugins from their repository.
 *
 * @todo do not hard-code plugins git repository.
 * @function
 */
export async function download() {
  const github = new GitHub.Application(
    process.env.GH_ISSUES_CLIENT_ID,
    'https://github.com/playliga/plugins.git',
  );

  // grab the latest plugins release
  let latest: Awaited<ReturnType<typeof github.getAllReleases>>;

  try {
    latest = await github.getAllReleases();
  } catch (error) {
    return Promise.reject(error);
  }

  // bail if no assets are found in the release
  const asset = latest[0].assets.find((asset) => asset.name.includes('.zip'));

  if (!asset) {
    return Promise.reject('Plugins not found.');
  }

  // initialize the plugins dir
  const destination = path.join(getPath(), path.basename(asset.browser_download_url));

  try {
    await fs.promises.access(destination, fs.constants.F_OK);
    return Promise.resolve();
  } catch (error) {
    await init();
  }

  // download the file and extract
  const response = await fetch(asset.browser_download_url);
  await pipeline(
    Readable.fromWeb(response.body as ReadableStream<Uint8Array>),
    fs.createWriteStream(destination),
  );

  return extract(destination, path.dirname(getPath()));
}
