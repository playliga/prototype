/**
 * Utility functions for common file management tasks such as
 * extracting archives, mirroring directories and more.
 *
 * @module
 */
import fs from 'node:fs';
import path from 'node:path';
import compressing from 'compressing';
import { glob } from 'glob';

/**
 * Compresses a file or directory.
 *
 * @param source  The file or directory to compress.
 * @param remove  Delete the source file or directory.
 * @function
 */
export async function compress(source: string, remove = false) {
  const from = await fs.promises.stat(source);
  const to = source + '.zip';

  if (from.isDirectory()) {
    await compressing.zip.compressDir(source, to);
  } else {
    await compressing.zip.compressFile(source, to);
  }

  if(remove) {
    await fs.promises.rm(source, { recursive: true });
  }

  return Promise.resolve(to);
}

/**
 * Copies every file matching the provided
 * glob pattern to the target directory.
 *
 * @param pattern The glob pattern.
 * @param cwd     The current working directory in which to search
 * @param to      The directory to copy files into.
 * @param backup  Create a backup before overwriting a file.
 * @function
 */
export async function copy(pattern: string, cwd: string, to: string, backup = true) {
  const files = await glob(pattern, { cwd, withFileTypes: true });
  return Promise.all(
    files.map(async (file) => {
      const source = path.join(cwd, file.relative());
      const target = path.join(to, file.relative());
      const targetBak = target + '.bak';
      const parents = path.dirname(target);

      // build directory tree to target path
      try {
        await fs.promises.access(parents, fs.constants.F_OK);
      } catch (error) {
        await fs.promises.mkdir(parents, { recursive: true });
      }

      // bail if file is a directory
      if (file.isDirectory()) {
        return Promise.resolve();
      }

      // create a backup if the target file already exists
      // and only if a backup hasn't already been made
      try {
        await fs.promises.access(target, fs.constants.F_OK);
        await fs.promises.access(targetBak, fs.constants.F_OK);
      } catch (error) {
        if (backup && error.path === targetBak) {
          await fs.promises.copyFile(target, targetBak);
        }
      }

      return fs.promises.copyFile(source, target);
    }),
  );
}

/**
 * Extracts a zip file.
 *
 * @param from  The file to extract.
 * @param to    The directory to extract to.
 * @function
 */
export async function extract(from: string, to: string) {
  try {
    await fs.promises.access(to, fs.constants.F_OK);
  } catch (error) {
    await fs.promises.mkdir(to, { recursive: true });
  }

  return compressing.zip.uncompress(from, to);
}

/**
 * Similar to bash's `touch` function with the added functionality
 * that the path to the file is created if it isn't found.
 *
 * @param file The file path.
 * @function
 */
export async function touch(file: string) {
  // build directory tree to target path
  const parents = path.dirname(file);

  try {
    await fs.promises.access(parents, fs.constants.F_OK);
  } catch (error) {
    await fs.promises.mkdir(parents, { recursive: true });
  }

  // now create the file if it doesn't exist
  try {
    await fs.promises.access(file, fs.constants.F_OK);
  } catch (error) {
    return (await fs.promises.open(file, 'w')).close();
  }

  return Promise.resolve();
}

/**
 * Restores every `.bak` file found in the specified directory.
 *
 * @param cwd     The current working directory in which to search
 * @function
 */
export async function restore(cwd: string) {
  const files = await glob('**/*.bak', { cwd, withFileTypes: true });
  return Promise.all(
    files.map(async (file) => {
      const source = path.join(cwd, file.relative());
      const target = path.join(cwd, file.relative().replace(/.bak$/, ''));

      // bail if file is a directory
      if (file.isDirectory()) {
        return Promise.resolve();
      }

      // copy the backup file to the original
      await fs.promises.copyFile(source, target);

      // remove the original
      return fs.promises.unlink(source);
    }),
  );
}
