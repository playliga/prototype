/**
 * Sponsors IPC handlers.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { Prisma } from '@prisma/client';
import { Constants, Eagers } from '@liga/shared';
import { DatabaseClient, WindowManager } from '@liga/backend/lib';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.SHORTLIST_ALL, (_, query?: Prisma.ShortlistFindManyArgs) =>
    DatabaseClient.prisma.shortlist.findMany({ ...Eagers.shortlist, ...query }),
  );
  ipcMain.handle(
    Constants.IPCRoute.SHORTLIST_DELETE,
    async (_, query: Prisma.ShortlistDeleteArgs) => {
      await DatabaseClient.prisma.shortlist.delete(query);

      // send shortlist update to all windows
      WindowManager.sendAll(Constants.IPCRoute.SHORTLIST_UPDATE);
    },
  );
  ipcMain.handle(
    Constants.IPCRoute.SHORTLIST_CREATE,
    async (_, query?: Prisma.ShortlistCreateArgs) => {
      await DatabaseClient.prisma.shortlist.create(query);

      // send shortlist update to all windows
      WindowManager.sendAll(Constants.IPCRoute.SHORTLIST_UPDATE);
    },
  );
}
