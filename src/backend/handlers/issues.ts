/**
 * GitHub issues IPC handlers.
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
import { app, ipcMain } from 'electron';
import { Constants, Util } from '@liga/shared';
import { DatabaseClient, FileManager, Firebase, Game, GitHub } from '@liga/backend/lib';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.ISSUES_ALL, async () => {
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const issues = Util.loadIssues(profile.issues);
    const github = new GitHub.Application(process.env.GH_ISSUES_CLIENT_ID, AppInfo.repository.url);
    return github.getIssuesByIds(issues);
  });
  ipcMain.handle(Constants.IPCRoute.ISSUES_COMMENTS, async (_, id: number) => {
    const github = new GitHub.Application(process.env.GH_ISSUES_CLIENT_ID, AppInfo.repository.url);
    return github.getIssueComments(id);
  });
  ipcMain.handle(
    Constants.IPCRoute.ISSUES_COMMENTS_CREATE,
    async (_, id: number, data: unknown) => {
      const github = new GitHub.Application(
        process.env.GH_ISSUES_CLIENT_ID,
        AppInfo.repository.url,
      );
      return github.createIssueComment(id, data);
    },
  );
  ipcMain.handle(
    Constants.IPCRoute.ISSUES_CREATE,
    async (
      _,
      data: { type: number; title: string; text: string; info: boolean; logs: boolean },
    ) => {
      // figure out paths to evidence files
      const profile = await DatabaseClient.prisma.profile.findFirst();
      const settings = Util.loadSettings(profile.settings);
      const issues = Util.loadIssues(profile.issues);
      const saveFilePath = DatabaseClient.path;
      const gameLogsPath = await Game.getGameLogFile(
        settings.general.game,
        settings.general.gamePath,
      );
      const appLogsPath = log.transports.file.getFile().path;

      // gather evidence
      const zipPath = path.join(os.tmpdir(), Util.sanitizeFileName(profile.name));
      const zipFiles = [saveFilePath, saveFilePath + '-wal'];

      try {
        await fs.promises.access(zipPath, fs.constants.F_OK);
      } catch (error) {
        await fs.promises.mkdir(zipPath);
      }

      if (data.logs) {
        zipFiles.push(appLogsPath);
        zipFiles.push(gameLogsPath);
      }

      await Promise.all(
        zipFiles.map(async (file) => {
          try {
            await fs.promises.access(file, fs.constants.F_OK);
            await fs.promises.copyFile(file, path.join(zipPath, path.basename(file)));
          } catch (error) {
            log.warn('%s not found. Skipping...', file);
            return Promise.resolve();
          }
        }),
      );

      // upload evidence to firebase
      const zip = await FileManager.compress(zipPath, true);
      const firebase = new Firebase.Storage(
        process.env.FIREBASE_CLIENT_EMAIL,
        process.env.FIREBASE_KEY_ID,
        process.env.FIREBASE_PROJECT_ID,
      );
      const firebaseBucket = await firebase.upload(zip);

      // build issue text
      const textIssue = dedent`
        # Describe the Bug
        {{it.text}}

        {{@if(it.info)}}
        # Technical Information
        - OS: \`{{it.os}}\`
        - App Version: \`{{it.version}}\`
        {{/if}}

        # Additional Context
        - [{{it.download.name}}]({{it.download.url}})
      `;
      const bodyFeature = dedent`
        # Describe the Feature
        {{it.text}}
      `;

      // create the issue
      const github = new GitHub.Application(
        process.env.GH_ISSUES_CLIENT_ID,
        AppInfo.repository.url,
      );
      const issue = await github.createIssue({
        title: data.title,
        type: Number(data.type) === Constants.IssueType.BUG ? 'bug' : 'feature',
        body: Sqrl.render(
          Number(data.type) === Constants.IssueType.BUG ? textIssue : bodyFeature,
          {
            text: data.text,
            info: data.info,
            version: is.production() ? app.getVersion() : AppInfo.version,
            os: `${os.platform()} ${os.release()}`,
            download: {
              name: firebaseBucket.name,
              url: firebase.download(firebaseBucket),
            },
          },
          {
            autoEscape: false,
            rmWhitespace: false,
          },
        ),
      });

      // record the issue in the database
      issues.push(issue.number);
      await DatabaseClient.prisma.profile.update({
        where: {
          id: profile.id,
        },
        data: {
          issues: JSON.stringify(issues),
        },
      });

      // return the issue
      return Promise.resolve(issue);
    },
  );
  ipcMain.handle(Constants.IPCRoute.ISSUES_FIND, async (_, id: number) => {
    const github = new GitHub.Application(process.env.GH_ISSUES_CLIENT_ID, AppInfo.repository.url);
    return github.getIssue(id);
  });
}
