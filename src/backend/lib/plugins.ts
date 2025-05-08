/**
 * Game plugins manager.
 *
 * @module
 */
import * as GitHub from './github';
import path from 'node:path';
import fs from 'node:fs';
import events from 'node:events';
import log from 'electron-log';
import compressing from 'compressing';
import AppInfo from 'package.json';
import { app } from 'electron';
import { Constants } from '@liga/shared';

/** @enum */
export enum EventIdentifier {
  CHECKING = 'checking',
  DOWNLOADING = 'downloading',
  DOWNLOAD_PROGRESS = 'download-progress',
  ERROR = 'error',
  FINISHED = 'finished',
  INSTALL = 'installing',
  NO_UPDATE = 'no-updates',
  UPDATE_AVAILABLE = 'update-available',
}

/** @interface */
export interface PluginEvents {
  [EventIdentifier.CHECKING]: () => void;
  [EventIdentifier.DOWNLOADING]: () => void;
  [EventIdentifier.DOWNLOAD_PROGRESS]: (percent: number) => void;
  [EventIdentifier.ERROR]: () => void;
  [EventIdentifier.FINISHED]: () => void;
  [EventIdentifier.INSTALL]: () => void;
  [EventIdentifier.NO_UPDATE]: () => void;
  [EventIdentifier.UPDATE_AVAILABLE]: () => void;
}

/**
 * Adds types to the event emitter the
 * {Manager} class is extending.
 *
 * @interface
 */
export interface Manager {
  on<U extends keyof PluginEvents>(event: U, listener: PluginEvents[U]): this;
  emit<U extends keyof PluginEvents>(event: U, ...args: Parameters<PluginEvents[U]>): boolean;
}

/**
 * Gets the base path to the plugins folder.
 *
 * @function
 */
export function getPath() {
  return process.env['NODE_ENV'] === 'cli'
    ? path.join(process.env.APPDATA, AppInfo.productName, Constants.Application.PLUGINS_DIR)
    : path.join(app.getPath('userData'), Constants.Application.PLUGINS_DIR);
}

/**
 * Plugin manager.
 *
 * @class
 */
export class Manager extends events.EventEmitter {
  private asset: GitHub.Asset;
  private github: GitHub.Application;
  public log: log.LogFunctions;
  public url: string;

  constructor(url: string) {
    super();
    this.github = new GitHub.Application(process.env.GH_ISSUES_CLIENT_ID, url);
    this.log = log.scope('plugins');
    this.url = url;
  }

  /**
   * Getter for the path to the game
   * plugins update zip file.
   *
   * @method
   */
  private get zipPath() {
    return path.join(getPath(), path.basename(this.asset.browser_download_url));
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
   * Initializes the plugins folder in the user data folder.
   *
   * @method
   */
  private async init() {
    try {
      await fs.promises.access(getPath(), fs.constants.F_OK);
      return Promise.resolve();
    } catch (_) {
      await fs.promises.mkdir(getPath(), { recursive: true });
    }
  }

  /**
   * Checks for game plugins updates.
   *
   * @param download Automatically download the update?
   * @method
   */
  public async checkForUpdates(download = true) {
    this.emit(EventIdentifier.CHECKING);

    // grab latest release
    let latest: Awaited<ReturnType<typeof this.github.getAllReleases>>;

    try {
      latest = await this.github.getAllReleases();
    } catch (error) {
      this.log.error(error);
      this.emit(EventIdentifier.ERROR);
      return Promise.resolve();
    }

    // bail if no assets are found in the release
    this.asset = latest[0].assets.find((asset) => asset.name.includes('.zip'));

    if (!this.asset) {
      this.emit(EventIdentifier.NO_UPDATE);
      return Promise.resolve();
    }

    // initialize the plugins dir
    try {
      await fs.promises.access(this.zipPath, fs.constants.F_OK);
      this.emit(EventIdentifier.NO_UPDATE);
      return Promise.resolve();
    } catch (_) {
      await this.init();
      this.emit(EventIdentifier.UPDATE_AVAILABLE);
    }

    // download and extract the plugins
    if (download) {
      await this.download();
      await this.extract();
    }
  }

  /**
   * Downloads the plugins zip.
   *
   * @method
   */
  public async download() {
    // download the file
    const response = await fetch(this.asset.browser_download_url);

    if (!response.ok || !response.body) {
      this.emit(EventIdentifier.NO_UPDATE);
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
   * Extracts the plugins zip.
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
      .on('finish', () => this.emit(EventIdentifier.FINISHED))
      .on('entry', async (file, stream, next) => {
        stream.on('end', () => {
          processedFiles++;
          this.emit(EventIdentifier.DOWNLOAD_PROGRESS, (processedFiles / totalFiles) * 100);
          next();
        });

        const to = path.join(path.dirname(getPath()), file.name);

        // @todo: how to better handle race condition where
        //        the file tree is not created in time
        if (file.type === 'file') {
          try {
            await fs.promises.access(path.dirname(to), fs.constants.F_OK);
          } catch (_) {
            this.log.warn('could not process: %s', file.name);
            await fs.promises.mkdir(path.dirname(to), { recursive: true });
          }
        }

        try {
          if (file.type === 'file') {
            stream.pipe(fs.createWriteStream(to));
          } else {
            await fs.promises.mkdir(to, { recursive: true });
            stream.resume();
          }
        } catch (error) {
          this.log.error(error);
          this.emit(EventIdentifier.ERROR);
        }
      });
  }
}
