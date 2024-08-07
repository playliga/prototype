/**
 * Match IPC handlers.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { Constants } from '@liga/shared';
import { DatabaseClient } from '@liga/backend/lib';
import { Prisma } from '@prisma/client';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.MATCHES_ALL, (_, query: Prisma.MatchFindManyArgs) =>
    DatabaseClient.prisma.match.findMany(query),
  );
  ipcMain.handle(Constants.IPCRoute.MATCHES_COUNT, (_, where?: Prisma.MatchWhereInput) =>
    DatabaseClient.prisma.match.count({ where }),
  );
  ipcMain.handle(
    Constants.IPCRoute.MATCHES_PREVIOUS,
    async (_, query: Partial<Prisma.MatchFindManyArgs> = {}, id: number, limit = 5) => {
      const profile = await DatabaseClient.prisma.profile.findFirst();
      return DatabaseClient.prisma.match.findMany({
        ...query,
        take: limit,
        where: {
          date: {
            lte: profile.date.toISOString(),
          },
          competitors: {
            some: {
              teamId: id,
            },
          },
          status: Constants.MatchStatus.COMPLETED,
        },
        orderBy: {
          date: 'desc',
        },
      });
    },
  );
  ipcMain.handle(
    Constants.IPCRoute.MATCHES_UPCOMING,
    async (_, query: Partial<Prisma.MatchFindManyArgs> = {}, limit = 5) => {
      const profile = await DatabaseClient.prisma.profile.findFirst();
      return DatabaseClient.prisma.match.findMany({
        ...query,
        take: limit,
        where: {
          date: {
            gte: profile.date.toISOString(),
          },
          competitors: {
            some: {
              teamId: profile.teamId,
            },
          },
          status: {
            lt: Constants.MatchStatus.COMPLETED,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });
    },
  );
}
