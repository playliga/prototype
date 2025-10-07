/**
 * Map pool IPC handlers.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { Prisma } from '@prisma/client';
import { Constants, Eagers } from '@liga/shared';
import { DatabaseClient } from '@liga/backend/lib';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.MAP_POOL_FIND, async (_, query: Prisma.MapPoolFindManyArgs) =>
    DatabaseClient.prisma.mapPool.findMany({
      ...query,
      include: Eagers.mapPool.include,
    }),
  );
  ipcMain.handle(Constants.IPCRoute.MAP_POOL_UPDATE, (_, query: Prisma.MapPoolUpdateArgs) =>
    DatabaseClient.prisma.mapPool.update(query),
  );
  ipcMain.handle(
    Constants.IPCRoute.MAP_POOL_UPDATE_MANY,
    (_, query: Prisma.MapPoolUpdateManyArgs) => DatabaseClient.prisma.mapPool.updateMany(query),
  );
}
