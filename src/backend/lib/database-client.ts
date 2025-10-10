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
 *         └── saves/
 *             └── save_1.db    // DatabaseClient.connect(1)
 * ```
 *
 * If the provided database identifier is not found, then
 * the module will create it as a copy of a modded
 * `save_0.db` or fallback to the default one
 * in the application's resources folder.
 *
 * # Example
 *
 * ```js
 * // connect and do some work
 * const db1 = await DatabaseClient.connect(1);
 *
 * // disconnect and connect to another SQLite3 database
 * await DatabaseClient.disconnect();
 * const db2 = await DatabaseClient.connect(2);
 * ```
 *
 * @module
 */
import * as sqlite3 from 'sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import util from 'node:util';
import log from 'electron-log';
import { app } from 'electron';
import { PrismaClient } from '@prisma/client';
import { glob } from 'glob';
import { Constants, Eagers, Util, is } from '@liga/shared';

/** @interface */
interface PrismaMigration {
  id: string;
  checksum: string;
  finished_at: Date;
  migration_name: string;
  started_at: Date;
}

/** @type {PrismaClientExtended} */
type PrismaClientExtended = ReturnType<(typeof DatabaseClient)['clientExtensions']>;

/**
 * Contains the pool of cached prisma clients and records.
 *
 * @constant
 */
const pool = [] as Array<{
  client: PrismaClientExtended;
  path: string;
  records: Record<string, unknown>;
}>;

/**
 * Unique identifier for the active database.
 *
 * @constant
 */
let activeId = 0;

/** @class */
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
              DatabaseClient.log.silly('cache hit for profile.');
              return pool[activeId].records.profile;
            }

            DatabaseClient.log.silly('cache miss for profile.');
            pool[activeId].records.profile = await query({
              ...args,
              ...Eagers.profile,
            });
            return pool[activeId].records.profile;
          },
          async update({ args, query }) {
            DatabaseClient.log.silly('hydrating profile cache...');
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
  public static async connect(id = activeId) {
    // return cached client if already connected to provided
    // db otherwise dereference the existing one
    if (pool[id] && activeId === id) {
      return pool[id].client;
    } else {
      delete pool[activeId];
    }

    // initialize the save file
    let newSavePath: string;

    try {
      newSavePath = await this.initSave(id);
    } catch (error) {
      this.log.error(error);
      return Promise.reject();
    }

    // run database migrations
    await DatabaseClient.migrate(id);

    // initialize the new client
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${newSavePath}?connection_limit=1`,
        },
      },
    });
    pool[id] = {
      client: DatabaseClient.clientExtensions(prisma),
      path: newSavePath,
      records: {},
    };

    // update the active db id
    activeId = id;
    return pool[id].client;
  }

  /**
   * Disconnects from the database and cleans
   * up the client from the cache.
   *
   * @method
   */
  public static async disconnect() {
    await pool[activeId].client.$disconnect();
    delete pool[activeId];
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
      app.getPath('userData'),
      Constants.Application.CUSTOM_DIR,
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
   * If the provided database path does not exist then
   * a new one will be created from the root save.
   *
   * The root save can be a modded save if compatible
   * with the current version of the application.
   *
   * @param id The database id.
   * @method
   */
  public static async initSave(id = activeId) {
    const rootSaveName = Util.getSaveFileName(0);
    const rootSavePath = path.join(DatabaseClient.localBasePath, rootSaveName);
    const newSaveName = Util.getSaveFileName(id);
    const newSavePath = path.join(DatabaseClient.basePath, newSaveName);

    // bail early if the file exists, otherwise
    // we build the file tree to the save file
    try {
      await fs.promises.access(newSavePath, fs.constants.F_OK);
      return Promise.resolve(newSavePath);
    } catch (_) {
      await fs.promises.mkdir(path.dirname(newSavePath), { recursive: true });
    }

    // bail early if we're using a modded save
    try {
      await DatabaseClient.initModdedDatabase(newSavePath);
      return Promise.resolve(newSavePath);
    } catch (error) {
      this.log.info(error);
    }

    // make a copy of the root save
    try {
      await fs.promises.copyFile(rootSavePath, newSavePath);
      return Promise.resolve(newSavePath);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Migrate the specified database.
   *
   * @param id The database to connect with.
   * @function
   */
  public static async migrate(id = activeId) {
    // set up db paths
    const targetDBName = Util.getSaveFileName(id);
    const targetDBPath = path.join(DatabaseClient.basePath, targetDBName);

    // bail if target db doesn't exist
    try {
      await fs.promises.access(targetDBPath, fs.constants.F_OK);
    } catch (_) {
      DatabaseClient.log.warn('Database %s does not exist. Skipping migration.', targetDBPath);
      return Promise.resolve(false);
    }

    // connect to the database directly through sqlite3 in order
    // to get the list of migrations that have been executed
    const cnx = new sqlite3.Database(targetDBPath, () =>
      DatabaseClient.log.debug('Migrating database %s...', targetDBPath),
    );
    const migrationsExisting = await new Promise<Array<PrismaMigration>>((resolve) =>
      cnx.all('SELECT * FROM _prisma_migrations', (_, rows: Array<PrismaMigration>) =>
        resolve(rows),
      ),
    );

    // load up migration files
    const migrationsBasePath = path.join(path.dirname(DatabaseClient.localBasePath), 'migrations');
    const migrationsAll = await glob('*_*', {
      cwd: path.normalize(migrationsBasePath),
      withFileTypes: true,
      stat: true,
    });
    const migrationsNew = migrationsAll.sort((a, b) => {
      const re = new RegExp(/^(\d+)_/);
      const [, timestampA] = a.name.match(re);
      const [, timestampB] = b.name.match(re);
      return Number(timestampA) - Number(timestampB);
    });

    // run through the migrations
    for (const migration of migrationsNew) {
      if (migrationsExisting.some((existing) => existing.migration_name === migration.name)) {
        DatabaseClient.log.debug('Migration %s already applied. Skipping.', migration.name);
        continue;
      }

      // split the migration file contents by `;` and
      // sanitize comments and empty new lines
      const file = await fs.promises.readFile(
        path.join(migrationsBasePath, migration.relative(), 'migration.sql'),
        'utf8',
      );
      const queries = file
        .replace(/^--.+$/gm, '')
        .split(';')
        .filter((query) => query.trim());

      // run this migration
      DatabaseClient.log.debug('Applying migration `%s`...', migration.name);

      await new Promise((resolve) => {
        cnx.serialize(() => {
          cnx.run('BEGIN TRANSACTION');
          queries.forEach((query) => cnx.run(query));
          cnx.run(
            `
            INSERT INTO _prisma_migrations (id,checksum,finished_at,migration_name,started_at)
            VALUES (?,?,?,?,?)
            `,
            [
              crypto.randomUUID(),
              crypto.createHash('sha256').update(file, 'utf8').digest('hex'),
              Date.now(),
              migration.name,
              Date.now(),
            ],
          );
          cnx.run('COMMIT');
          resolve(true);
        });
      });
    }

    // close the connection
    return new Promise((resolve) => cnx.close(resolve));
  }

  /**
   * A getter for the Prisma client that returns
   * a cached version, if applicable.
   *
   * @method
   */
  public static get prisma() {
    return pool[activeId].client;
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
   * Gets the absolute base path to the databases
   * directory found within %APPDATA%.
   *
   * @method
   */
  public static get basePath() {
    return process.env['NODE_ENV'] === 'cli'
      ? path.join(process.env.APPDATA, 'LIGA Esports Manager', Constants.Application.DATABASES_DIR)
      : path.join(app.getPath('userData'), Constants.Application.DATABASES_DIR);
  }

  /**
   * Gets the absolute base path to the local databases directory
   * found within the application resources folder.
   *
   * @function
   */
  public static get localBasePath() {
    if (process.env['NODE_ENV'] === 'cli') {
      return path.join(
        __dirname,
        '../../../src/backend/prisma',
        Constants.Application.DATABASES_DIR,
      );
    }

    return is.dev()
      ? path.join(__dirname, '../../src/backend/prisma', Constants.Application.DATABASES_DIR)
      : path.join(process.resourcesPath, Constants.Application.DATABASES_DIR);
  }

  /**
   * Gets the path to the currently
   * connected database file.
   *
   * @function
   */
  public static get path() {
    return pool[activeId].path;
  }

  /**
   * Renames the old `databases` folder to `saves` in
   * order to resolve a naming collision with Chromium.
   *
   * @todo remove after beta
   * @function
   */
  public static async patchForChromium() {
    const oldPath = DatabaseClient.basePath.replace(
      Constants.Application.DATABASES_DIR,
      'databases',
    );
    const newPath = DatabaseClient.basePath;

    // first check if the old path exists
    // and if it doesn't we bail early
    try {
      await fs.promises.access(oldPath, fs.constants.F_OK);
    } catch (_) {
      return;
    }

    this.log.info('Moving "%s" to "%s"', oldPath, newPath);
    return fs.promises.rename(oldPath, newPath);
  }
}
