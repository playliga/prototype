/**
 * Exposes a cached version of the Prisma Client
 * via a getter defined in the default export.
 *
 * # Usage
 *
 * Assuming the following directory structure:
 *
 * ```
 * %APPDATA%/
 * └── Roaming/
 *     └── <app>/
 *         └── databases/
 *             ├── save_0.db    // DatabaseClient.connect()
 *             └── save_1.db    // DatabaseClient.connect(1)
 * ```
 *
 * If the provided database identifier is not found, then
 * the module will create it as a copy of `save_0.db`.
 *
 * # Example
 *
 * ```js
 * // connect and do some work
 * const db1 = DatabaseClient.connect(1);
 * // <some business logic>
 *
 * // disconnect and connect to another SQLite3 database
 * await DatabaseClient.prisma.$disconnect();
 * const db2 = DatabaseClient.connect(2);
 * ```
 *
 * @module
 */
import fs from 'fs';
import path from 'path';
import util from 'util';
import is from 'electron-is';
import log from 'electron-log';
import { app } from 'electron';
import { PrismaClient } from '@prisma/client';
import { Constants, Eagers } from '@liga/shared';

/** @type {PrismaClientExtended} */
type PrismaClientExtended = ReturnType<(typeof DatabaseClient)['clientExtensions']>;

/**
 * Contains the pool of cached prisma clients and records.
 *
 * @constant
 */
const pool = [] as Array<{
  client: PrismaClientExtended;
  records: Record<string, unknown>;
}>;

/**
 * Unique identifier for the active database.
 *
 * @constant
 */
let activeId = 0;

/**
 * Database class.
 *
 * @class
 */
export default class DatabaseClient {
  /** @constant */
  private static log = log.scope('database');

  /**
   * Configure client extensions.
   *
   * @param prisma The prisma client instance.
   * @function
   */
  private static clientExtensions(prisma: PrismaClient) {
    return prisma.$extends({
      query: {
        profile: {
          // @todo: fix typings for eager loaded relations
          async findFirst({ args, query }) {
            if (pool[activeId].records.profile) {
              DatabaseClient.log.debug('cache hit for profile.');
              return pool[activeId].records.profile;
            }

            DatabaseClient.log.debug('cache miss for profile.');
            pool[activeId].records.profile = await query({
              ...args,
              ...Eagers.profile,
            });
            return pool[activeId].records.profile;
          },
          async update({ args, query }) {
            DatabaseClient.log.debug('hydrating profile cache...');
            pool[activeId].records.profile = await query({
              ...args,
              ...Eagers.profile,
            });
            return pool[activeId].records.profile;
          },
        },
      },
    });
  }

  /**
   * Sets up the application database files
   * and initializes the Prisma client.
   *
   * @param id The database to connect with.
   * @method
   */
  public static connect(id = activeId) {
    // return cached client if already connected to provided
    // db otherwise dereference the existing one
    if (pool[id] && activeId === id) {
      return pool[id].client;
    } else {
      delete pool[activeId];
    }

    // set up db paths
    const localDBName = util.format(Constants.Application.DATABASE_NAME_FORMAT, 0);
    const targetDBName = util.format(Constants.Application.DATABASE_NAME_FORMAT, id);
    const targetDBPath =
      process.env['NODE_ENV'] === 'cli'
        ? path.join(process.env.APPDATA, 'LIGA Esports Manager/databases', targetDBName)
        : path.join(app.getPath('userData'), 'databases', targetDBName);
    const localDBPath =
      process.env['NODE_ENV'] === 'cli' || is.dev()
        ? path.join(__dirname, '../../src/backend/prisma/databases', localDBName)
        : path.join(process.resourcesPath, 'databases', localDBName);

    // copy the local db over to the app directory
    // if it doesn't already exist
    if (!fs.existsSync(path.dirname(targetDBPath))) {
      fs.mkdirSync(path.dirname(targetDBPath));
    }

    if (!fs.existsSync(targetDBPath)) {
      fs.copyFileSync(localDBPath, targetDBPath);
    }

    // initialize the new client
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${targetDBPath}?connection_limit=1`,
        },
      },
    });
    pool[id] = { client: DatabaseClient.clientExtensions(prisma), records: {} };

    // update the active db id
    activeId = id;
    return pool[id].client;
  }

  /**
   * A getter for the Prisma client that returns
   * a cached version, if applicable.
   *
   * @method
   */
  public static get prisma() {
    return DatabaseClient.connect();
  }

  /**
   * Force sets the Prisma client.
   *
   * @method
   */
  public static set prisma(client: PrismaClientExtended) {
    pool[activeId].client = client;
  }

  /**
   * Gets the absolute base path to the databases directory.
   *
   * @method
   */
  public static get basePath() {
    return path.join(app.getPath('userData'), 'databases');
  }
}
