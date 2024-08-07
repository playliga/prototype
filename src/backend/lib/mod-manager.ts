/**
 * Mod manager.
 *
 * @module
 */
import * as sqlite3 from 'sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import util from 'node:util';
import { app } from 'electron';
import { Util } from '@liga/shared';

/**
 * Gets the base path to the mods folder.
 *
 * @function
 */
export function getPath() {
  return path.join(app.getPath('userData'), 'custom');
}

/**
 * Initializes the mod folder in the app's resources folder.
 *
 * @function
 */
export async function init() {
  // bail early if we're in cli mode
  if (process.env['NODE_ENV'] === 'cli') {
    return Promise.resolve();
  }

  try {
    await fs.promises.access(getPath(), fs.constants.F_OK);
    return Promise.resolve();
  } catch (error) {
    await fs.promises.mkdir(path.dirname(getPath()), { recursive: true });
  }
}

/**
 * Checks if there is a modded database and validates that it
 * is compatible with the current version of the application.
 *
 * If so, it creates a copy of it to be used as the new save.
 *
 * @param newSavePath Where to copy the modded database to.
 * @function
 */
export async function initModdedDatabase(newSavePath: string) {
  // bail early if we're in cli mode
  if (process.env['NODE_ENV'] === 'cli') {
    return Promise.reject('Modding not supported while in CLI mode.');
  }

  // create the file tree if it doesn't already exist
  const customSavePath = path.join(getPath(), 'databases', Util.getSaveFileName(0));

  try {
    await fs.promises.access(path.dirname(customSavePath), fs.constants.F_OK);
  } catch (error) {
    await fs.promises.mkdir(path.dirname(customSavePath), { recursive: true });
  }

  // do we have a modded database?
  try {
    await fs.promises.access(customSavePath, fs.constants.F_OK);
  } catch (error) {
    return Promise.reject('No modded database found.');
  }

  // make sure the save is compatible
  const cnx = new sqlite3.Database(customSavePath);
  const [applicationId] = await new Promise<Array<{ application_id: number }>>((resolve) =>
    cnx.all('PRAGMA application_id;', (_, rows: Array<{ application_id: number }>) =>
      resolve(rows),
    ),
  );
  await new Promise((resolve) => cnx.close(resolve));

  if (applicationId.application_id < 0) {
    return Promise.reject(util.format('Database "%s" is not compatible!', customSavePath));
  }

  // make a copy of the modded save
  try {
    await fs.promises.copyFile(customSavePath, newSavePath);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(util.format('Could not copy modded database to: %s', newSavePath));
  }
}
