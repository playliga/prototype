/**
 * IPC handlers for the mod manager.
 *
 * @module
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { app, ipcMain } from 'electron';
import { glob } from 'glob';
import { Constants } from '@liga/shared';
import { Mods } from '@liga/backend/lib';

/** @constant */
const MODS_REPO_URL = 'https://github.com/playliga/mods.git';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.MODS_ALL, () => {
    const mods = new Mods.Manager(MODS_REPO_URL);
    return mods.all();
  });
  ipcMain.handle(Constants.IPCRoute.MODS_DELETE, async () => {
    const mods = new Mods.Manager(MODS_REPO_URL);
    return mods.delete();
  });
  ipcMain.on(Constants.IPCRoute.MODS_DOWNLOAD, async (event, data: string) => {
    // initialize the mod manager
    const mods = new Mods.Manager(MODS_REPO_URL);

    // register event handlers
    mods.on(Mods.EventIdentifier.DOWNLOADING, () =>
      event.reply(Constants.IPCRoute.MODS_DOWNLOADING),
    );
    mods.on(Mods.EventIdentifier.DOWNLOAD_PROGRESS, (percent) =>
      event.reply(Constants.IPCRoute.MODS_DOWNLOAD_PROGRESS, percent),
    );
    mods.on(Mods.EventIdentifier.ERROR, () => event.reply(Constants.IPCRoute.MODS_ERROR));
    mods.on(Mods.EventIdentifier.FINISHED, () => event.reply(Constants.IPCRoute.MODS_FINISHED));
    mods.on(Mods.EventIdentifier.INSTALL, () => event.reply(Constants.IPCRoute.MODS_INSTALLING));

    // start the download
    await mods.download(data);
    await mods.extract();
  });
  ipcMain.handle(Constants.IPCRoute.MODS_GET_INSTALLED, Mods.Manager.getInstalledModList);
  ipcMain.handle(Constants.IPCRoute.MODS_LAUNCH, async () => {
    // load available mods from upstream repo
    const mods = new Mods.Manager(MODS_REPO_URL);
    await mods.all();

    // launch app if already installed
    let execFilePath: string;

    try {
      const modName = await Mods.Manager.getInstalledModExecutableName();
      const metadata = mods.metadata.find((metadata) => modName === metadata.name + '.zip');

      if (!metadata) {
        throw 'mod metadata not found!';
      }

      execFilePath = path.join(app.getPath('appData'), '../Local/' + metadata.executable);
      await fs.promises.access(execFilePath, fs.constants.F_OK);
    } catch (_) {
      execFilePath = null;
    }

    // fallback to exe in mods folder
    if (!execFilePath) {
      try {
        const [execFileLocal] = await glob('*.exe', { cwd: Mods.getPath(), withFileTypes: true });

        if (!execFileLocal) {
          throw 'no mod executable found!';
        }

        execFilePath = path.join(execFileLocal.parent.fullpath(), execFileLocal.name);
        await fs.promises.access(execFilePath, fs.constants.F_OK);
      } catch (_) {
        execFilePath = null;
      }
    }

    // bail if a file path could not be found
    if (!execFilePath) {
      return;
    }

    // otherwise, try and launch it
    const ps = spawn(execFilePath, {
      detached: true,
      stdio: 'ignore',
    });
    ps.unref();
  });
}
