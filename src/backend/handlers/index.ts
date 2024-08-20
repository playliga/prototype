/**
 * Generic IPC handlers.
 *
 * @module
 */
import * as Sqrl from 'squirrelly';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import is from 'electron-is';
import log from 'electron-log';
import dedent from 'dedent';
import AppInfo from 'package.json';
import { app, dialog, ipcMain, shell } from 'electron';
import { Constants } from '@liga/shared';
import { DatabaseClient, WindowManager } from '@liga/backend/lib';

export { default as IPCDatabaseHandler } from './database';
export { default as IPCWIndowHandler } from './window';
export { default as IPCBlazonryHandler } from './blazonry';
export { default as IPCUpdaterHandler } from './updater';
export { default as IPCCalendarHandler } from './calendar';
export { default as IPCMatchHandler } from './match';
export { default as IPCPlayHandler } from './play';
export { default as IPCProfileHandler } from './profile';
export { default as IPCTransferHandler } from './transfer';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export function IPCGenericHandler() {
  // generic app handlers
  ipcMain.handle(
    Constants.IPCRoute.APP_DIALOG,
    (_, parentId: string, options: Electron.OpenDialogOptions) =>
      dialog.showOpenDialog(WindowManager.get(parentId), options),
  );

  ipcMain.handle(Constants.IPCRoute.APP_EXTERNAL, (_, url: string) => shell.openExternal(url));

  ipcMain.handle(Constants.IPCRoute.APP_INFO, () =>
    Promise.resolve({
      name: is.production() ? app.getName() : AppInfo.productName,
      version: is.production() ? app.getVersion() : AppInfo.version,
    }),
  );

  // creates an issue on the public releases
  // repository via the github api
  ipcMain.handle(
    Constants.IPCRoute.APP_ISSUE,
    async (
      _,
      data: { type: number; title: string; text: string; info: boolean; logs: boolean },
    ) => {
      // figure out path to game dir
      const profile = await DatabaseClient.prisma.profile.findFirst();
      const settings = JSON.parse(profile.settings) as typeof Constants.Settings;
      const gameLogsPath = (() => {
        switch (settings.general.game) {
          case Constants.Game.CS16:
            return path.join(
              settings.general.gamePath,
              Constants.GameSettings.CS16_BASEDIR,
              Constants.GameSettings.CS16_LOGFILE,
            );
          case Constants.Game.CSS:
            return path.join(
              settings.general.gamePath,
              Constants.GameSettings.CSSOURCE_BASEDIR,
              Constants.GameSettings.CSSOURCE_GAMEDIR,
              Constants.GameSettings.CSSOURCE_LOGFILE,
            );
          default:
            return path.join(
              settings.general.gamePath,
              Constants.GameSettings.CSGO_BASEDIR,
              Constants.GameSettings.CSGO_GAMEDIR,
              Constants.GameSettings.CSGO_LOGFILE,
            );
        }
      })();

      // build issue text
      const textIssue = dedent`
        # Describe the Bug
        {{it.text}}

        {{@if(it.info)}}
        # Technical Information
        - OS: \`{{it.os}}\`
        - App Version: \`{{it.version}}\`
        {{/if}}

        {{@if(it.logs)}}
        # Additional Context
        <details>
          <summary>Application Logs</summary>\n
          \`\`\`
          {{it.appLogs}}
          \`\`\`
        </details>
        <details>
          <summary>Game Logs</summary>\n
          \`\`\`
          {{it.gameLogs}}
          \`\`\`
        </details>
        {{/if}}
      `;
      const bodyFeature = dedent`
        # Describe the Feature
        {{it.text}}
      `;

      // send the request
      const repoInfo = AppInfo.homepage.match(/github\.com\/(?<owner>\w+)\/(?<repo>.+)/);
      const response = await fetch(
        `https://api.github.com/repos/${repoInfo.groups.owner}/${repoInfo.groups.repo.toLowerCase()}-public/issues`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: 'Bearer ' + process.env.GITHUB_ISSUES_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: JSON.stringify({
            title: data.title,
            labels: [data.type === Constants.IssueType.BUG ? 'bug' : 'feature-request'],
            body: Sqrl.render(
              data.type === Constants.IssueType.BUG ? textIssue : bodyFeature,
              {
                text: data.text,
                info: data.info,
                logs: data.logs,
                version: is.production() ? app.getVersion() : AppInfo.version,
                os: `${os.platform()} ${os.release()}`,
                appLogs: await fs.promises.readFile(log.transports.file.getFile().path, 'utf8'),
                gameLogs: await fs.promises.readFile(gameLogsPath, 'utf8'),
              },
              {
                autoEscape: false,
                rmWhitespace: false,
              },
            ),
          }),
        },
      );
      return response.json();
    },
  );

  // runs app and system checks and returns any errors
  ipcMain.handle(Constants.IPCRoute.APP_STATUS, async () => {
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const settings = JSON.parse(profile.settings) as typeof Constants.Settings;
    const steamPath = path.join(settings.general.steamPath, Constants.GameSettings.STEAM_EXE);
    const gamePath = (() => {
      switch (settings.general.game) {
        case Constants.Game.CS16:
          return path.join(
            settings.general.gamePath,
            Constants.GameSettings.CS16_BASEDIR,
            Constants.GameSettings.CS16_EXE,
          );
        case Constants.Game.CSS:
          return path.join(
            settings.general.gamePath,
            Constants.GameSettings.CSSOURCE_BASEDIR,
            Constants.GameSettings.CSSOURCE_EXE,
          );
        default:
          return path.join(
            settings.general.gamePath,
            Constants.GameSettings.CSGO_BASEDIR,
            Constants.GameSettings.CSGO_EXE,
          );
      }
    })();

    try {
      await fs.promises.access(steamPath, fs.constants.F_OK);
      await fs.promises.access(gamePath, fs.constants.F_OK);
      return Promise.resolve();
    } catch (error) {
      return Promise.resolve(error.message);
    }
  });
}
