/**
 * Game plugin manager.
 *
 * @module
 */
import * as GitHub from './github';
import path from 'node:path';
import fs from 'node:fs';
import events from 'node:events';
import log from 'electron-log';
import AppInfo from 'package.json';
import { pipeline } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'node:stream';
import { extract } from './file-manager';

/** @enum */
export enum EventIdentifier {
  CHECKING = 'checking',
  DOWNLOADING = 'downloading',
  DOWNLOAD_PROGRESS = 'download-progress',
  ERROR = 'error',
  FINISHED = 'finished',
  INSTALL = 'installing',
  NO_UPDATE = 'no-updates',
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
 * @todo add macos support
 * @function
 */
export function getPath() {
  return path.join(process.env.APPDATA, AppInfo.productName, 'plugins');
}

/**
 * Plugin manager.
 *
 * @class
 */
export class Manager extends events.EventEmitter {
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
   * Initializes the plugins folder in the user data folder.
   *
   * @method
   */
  private async init() {
    try {
      await fs.promises.access(getPath(), fs.constants.F_OK);
      return Promise.resolve();
    } catch (error) {
      await fs.promises.mkdir(getPath(), { recursive: true });
    }
  }

  /**
   * Checks for updates and if any are found
   * downloads the plugins from the repo.
   *
   * @method
   */
  public async checkForUpdates() {
    this.emit(EventIdentifier.CHECKING);

    // grab latest release
    let latest: Awaited<ReturnType<typeof this.github.getAllReleases>>;

    try {
      latest = await this.github.getAllReleases();
    } catch (error) {
      this.log.error(error);
      return this.emit(EventIdentifier.ERROR);
    }

    // bail if no assets are found in the release
    const asset = latest[0].assets.find((asset) => asset.name.includes('.zip'));

    if (!asset) {
      return this.emit(EventIdentifier.NO_UPDATE);
    }

    // initialize the plugins dir
    const destination = path.join(getPath(), path.basename(asset.browser_download_url));

    try {
      await fs.promises.access(destination, fs.constants.F_OK);
      return this.emit(EventIdentifier.NO_UPDATE);
    } catch (error) {
      this.emit(EventIdentifier.DOWNLOADING);
      await this.init();
    }

    // download the file
    const response = await fetch(asset.browser_download_url);

    if (!response.ok || !response.body) {
      return this.emit(EventIdentifier.NO_UPDATE);
    }

    // track download progress
    const totalSize = Number(response.headers.get('content-length'));
    const readableStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
    let downloadedSize = 0;

    readableStream.on('data', (chunk) => {
      downloadedSize += chunk.length;
      this.emit(EventIdentifier.DOWNLOAD_PROGRESS, (downloadedSize / totalSize) * 100);
    });

    // pipe the download to a file and extract
    await pipeline(readableStream, fs.createWriteStream(destination));
    this.emit(EventIdentifier.INSTALL);

    await extract(destination, path.dirname(getPath()));
    this.emit(EventIdentifier.FINISHED);
  }
}
