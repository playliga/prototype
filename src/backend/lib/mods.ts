/**
 * Mod manager.
 *
 * @module
 */
import * as FileManager from './file-manager';
import * as GitHub from './github';
import * as sqlite3 from 'sqlite3';
import events from 'node:events';
import path from 'node:path';
import fs from 'node:fs';
import util from 'node:util';
import compressing from 'compressing';
import log from 'electron-log';
import { pipeline } from 'node:stream/promises';
import { app } from 'electron';
import { Constants, Util } from '@liga/shared';

/** @enum */
export enum EventIdentifier {
  DOWNLOADING = 'downloading',
  DOWNLOAD_PROGRESS = 'download-progress',
  ERROR = 'error',
  FINISHED = 'finished',
  INSTALL = 'installing',
}

/** @interface */
export interface ModEvents {
  [EventIdentifier.DOWNLOADING]: () => void;
  [EventIdentifier.DOWNLOAD_PROGRESS]: (percent: number) => void;
  [EventIdentifier.ERROR]: () => void;
  [EventIdentifier.FINISHED]: () => void;
  [EventIdentifier.INSTALL]: () => void;
}

/**
 * Adds types to the event emitter the
 * {Manager} class is extending.
 *
 * @interface
 */
export interface Manager {
  on<U extends keyof ModEvents>(event: U, listener: ModEvents[U]): this;
  emit<U extends keyof ModEvents>(event: U, ...args: Parameters<ModEvents[U]>): boolean;
}

/**
 * Gets the base path to the mods folder.
 *
 * @function
 */
export function getPath() {
  return process.env['NODE_ENV'] === 'cli'
    ? path.join(process.env.APPDATA, 'LIGA Esports Manager', 'custom')
    : path.join(app.getPath('userData'), 'custom');
}

/**
 * Mod manager.
 *
 * @class
 */
export class Manager extends events.EventEmitter {
  private asset: GitHub.Asset;
  private assets: Array<GitHub.Asset>;
  private github: GitHub.Application;
  public log: log.LogFunctions;
  public metadata: Array<ModMetadata>;
  public url: string;

  constructor(url: string) {
    super();
    this.github = new GitHub.Application(process.env.GH_ISSUES_CLIENT_ID, url);
    this.log = log.scope('mods');
    this.url = url;
  }

  /**
   * Gets the name of the mod that is installed.
   *
   * @method
   */
  public static async getInstalledModName() {
    await FileManager.touch(Manager.getInstalledModFilePath());
    return fs.promises.readFile(Manager.getInstalledModFilePath(), 'utf8');
  }

  /**
   * Getter for the flat file that tracks
   * of what mod is installed.
   *
   * @method
   */
  private static getInstalledModFilePath() {
    return path.join(path.dirname(getPath()), 'InstalledMod');
  }

  /**
   * Initializes the mod folder in the app's resources folder.
   *
   * @method
   */
  public static async init() {
    try {
      await fs.promises.access(getPath(), fs.constants.F_OK);
      return Promise.resolve();
    } catch (_) {
      await fs.promises.mkdir(getPath(), { recursive: true });
    }
  }

  /**
   * Checks if there is a modded database and validates that it
   * is compatible with the current version of the application.
   *
   * If so, it creates a copy of it to be used as the new save.
   *
   * @param newSavePath Where to copy the modded database to.
   * @method
   */
  public static async initModdedDatabase(newSavePath: string) {
    // bail early if we're in cli mode
    if (process.env['NODE_ENV'] === 'cli') {
      return Promise.reject('Modding not supported while in CLI mode.');
    }

    // create the file tree if it doesn't already exist
    const customSavePath = path.join(
      getPath(),
      Constants.Application.DATABASES_DIR,
      Util.getSaveFileName(0),
    );

    try {
      await fs.promises.access(path.dirname(customSavePath), fs.constants.F_OK);
    } catch (_) {
      await fs.promises.mkdir(path.dirname(customSavePath), { recursive: true });
    }

    // do we have a modded database?
    try {
      await fs.promises.access(customSavePath, fs.constants.F_OK);
    } catch (_) {
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
    } catch (_) {
      return Promise.reject(util.format('Could not copy modded database to: %s', newSavePath));
    }
  }

  /**
   * Getter for the path to the mod zip file.
   *
   * @method
   */
  private get zipPath() {
    return path.join(getPath(), this.asset.name);
  }

  /**
   * Counts the number of headers (files) in a zip archive.
   *
   * @method
   */
  private async countFiles() {
    let totalFiles = 0;

    await new Promise((resolve, reject) => {
      new compressing.zip.UncompressStream({ source: this.zipPath })
        .on('error', reject)
        .on('finish', resolve)
        .on('entry', (_, __, next) => {
          totalFiles++;
          next();
        });
    });

    return totalFiles;
  }

  /**
   * Gets all available mods from the latest release
   * and updates the metadata index json file.
   *
   * @method
   */
  public async all() {
    const [latest] = await this.github.getAllReleases();
    this.assets = latest.assets;

    // store the metadata json file
    const metadataAsset = this.assets.find((asset) => asset.name === 'index.json');

    if (!metadataAsset) {
      return Promise.reject('Could not find index.json file');
    }

    try {
      const metadataResponse = await fetch(metadataAsset.browser_download_url);
      this.metadata = await metadataResponse.json();
    } catch (error) {
      this.log.error(error);
      return Promise.reject('Could not find index.json file');
    }

    return Promise.resolve(this.metadata);
  }

  /**
   * Deletes the currently installed mod folders.
   *
   * @function
   */
  public async delete() {
    // grab just the folders in the mods directory
    const items = await fs.promises.readdir(getPath(), { withFileTypes: true });
    const folders = items.filter((item) => item.isDirectory());

    // empty out the installed mod file
    await fs.promises.writeFile(Manager.getInstalledModFilePath(), '', 'utf8');

    // remove them
    return Promise.all(
      folders.map((folder) =>
        fs.promises.rm(path.join(folder.parentPath, folder.name), { recursive: true }),
      ),
    );
  }

  /**
   * Downloads the specified mod.
   *
   * @param name The name of the mod to download.
   * @method
   */
  public async download(name: string) {
    // load metadata if it hasn't already been preloaded
    if (!this.assets || !this.assets.length) {
      await this.all();
    }

    // initialize mod folder
    await Manager.init();

    // find the file to download by its name
    const asset = this.assets.find(
      (asset) => asset.name.toLowerCase() === name.toLowerCase() + '.zip',
    );

    if (!asset) {
      return Promise.resolve();
    } else {
      this.asset = asset;
    }

    // download the file
    const response = await fetch(this.asset.browser_download_url);

    if (!response.ok || !response.body) {
      return Promise.resolve();
    } else {
      this.emit(EventIdentifier.DOWNLOADING);
    }

    // track download progress
    let downloadedSize = 0;
    const totalSize = Number(response.headers.get('content-length'));
    const writableStream = fs.createWriteStream(this.zipPath);
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      downloadedSize += value.length;
      writableStream.write(value);
      this.emit(EventIdentifier.DOWNLOAD_PROGRESS, (downloadedSize / totalSize) * 100);
    }

    writableStream.end();
  }

  /**
   * Extracts a mod zip.
   *
   * @method
   */
  public async extract() {
    // in order to extract the file and provide progress, we need
    // to first process the zip and count the number of files
    let totalFiles = 0;

    this.emit(EventIdentifier.INSTALL);
    this.emit(EventIdentifier.DOWNLOAD_PROGRESS, 0.01);

    try {
      totalFiles = await this.countFiles();
    } catch (error) {
      this.log.error(error);
      this.emit(EventIdentifier.ERROR);
      return Promise.resolve();
    }

    // now we can extract the zip for real
    // and track extraction progress
    let processedFiles = 0;

    new compressing.zip.UncompressStream({ source: this.zipPath })
      .on('error', (error) => {
        this.log.error(error);
        this.emit(EventIdentifier.ERROR);
      })
      .on('finish', async () => {
        await FileManager.touch(Manager.getInstalledModFilePath());
        await fs.promises.writeFile(Manager.getInstalledModFilePath(), this.asset.name, 'utf8');
        this.emit(EventIdentifier.FINISHED);
      })
      .on('entry', async (file, stream, next) => {
        const to = path.join(path.dirname(getPath()), file.name);

        try {
          if (file.type === 'file') {
            await fs.promises.mkdir(path.dirname(to), { recursive: true });
            await pipeline(stream, fs.createWriteStream(to));
          } else {
            await fs.promises.mkdir(to, { recursive: true });
            stream.resume();
          }
        } catch (error) {
          this.log.warn('could not process: %s', file.name);
          this.log.warn(error);
          this.emit(EventIdentifier.ERROR);
          return next();
        }

        processedFiles++;
        this.emit(EventIdentifier.DOWNLOAD_PROGRESS, (processedFiles / totalFiles) * 100);
        next();
      });
  }
}
