/**
 * Database IPC handlers.
 *
 * @module
 */
import log from 'electron-log';
import { ipcMain } from 'electron';
import { Prisma } from '@prisma/client';
import { DatabaseClient, Game } from '@liga/backend/lib';
import { Util, Constants, Eagers } from '@liga/shared';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  // database connection handlers with faux timeout
  ipcMain.handle(Constants.IPCRoute.DATABASE_CONNECT, (_, id?: string) =>
    Util.sleep(200).then(async () => {
      DatabaseClient.connect(parseInt(id) || 0);

      // update last updated date on profile we're connecting to
      const profile = await DatabaseClient.prisma.profile.findFirst();

      if (!profile) {
        return Promise.resolve();
      }

      // load config
      const settings = JSON.parse(profile.settings) as typeof Constants.Settings;
      log.transports.console.level = settings.general.logLevel as log.LogLevel;
      log.transports.file.level = settings.general.logLevel as log.LogLevel;

      // if no game path is set, rediscover it
      //
      // @note: this can be removed once out of alpha
      if (!settings.general.gamePath) {
        settings.general.gamePath = await Game.discoverGamePath(
          settings.general.game,
          settings.general.steamPath,
        );
      }

      return DatabaseClient.prisma.profile.update({
        where: { id: profile.id },
        data: {
          updatedAt: new Date().toISOString(),
          settings: JSON.stringify(settings),
        },
      });
    }),
  );
  ipcMain.handle(Constants.IPCRoute.DATABASE_DISCONNECT, () =>
    Util.sleep(2000).then(() => DatabaseClient.prisma.$disconnect()),
  );

  // generic database query handlers
  ipcMain.handle(Constants.IPCRoute.COMPETITIONS_ALL, (_, query: Prisma.CompetitionFindManyArgs) =>
    DatabaseClient.prisma.competition.findMany(query),
  );
  ipcMain.handle(Constants.IPCRoute.CONTINENTS_ALL, (_, query: Prisma.ContinentFindManyArgs) =>
    DatabaseClient.prisma.continent.findMany(query),
  );
  ipcMain.handle(Constants.IPCRoute.EMAILS_ALL, (_, query: Prisma.EmailFindManyArgs) =>
    DatabaseClient.prisma.email.findMany(query),
  );
  ipcMain.handle(Constants.IPCRoute.EMAILS_DELETE, (_, ids: Array<number>) =>
    DatabaseClient.prisma.email.deleteMany({
      where: {
        id: { in: ids },
      },
    }),
  );
  ipcMain.handle(
    Constants.IPCRoute.EMAILS_UPDATE_DIALOGUE,
    async (_, query: Prisma.DialogueUpdateArgs) => {
      const dialogue = await DatabaseClient.prisma.dialogue.update(query);

      return DatabaseClient.prisma.email.findFirst({
        where: {
          id: dialogue.emailId,
        },
        include: Eagers.email.include,
      });
    },
  );
  ipcMain.handle(
    Constants.IPCRoute.EMAILS_UPDATE_MANY,
    async (_, query: Prisma.EmailUpdateManyArgs) => {
      await DatabaseClient.prisma.email.updateMany(query);

      return DatabaseClient.prisma.email.findMany({
        where: {
          id: { in: (query.where.id as Prisma.IntFilter).in },
        },
        include: Eagers.email.include,
      });
    },
  );
  ipcMain.handle(Constants.IPCRoute.FEDERATIONS_ALL, () =>
    DatabaseClient.prisma.federation.findMany(),
  );
  ipcMain.handle(Constants.IPCRoute.PLAYERS_ALL, (_, query?: Prisma.PlayerFindManyArgs) =>
    DatabaseClient.prisma.player.findMany(query),
  );
  ipcMain.handle(Constants.IPCRoute.PLAYERS_COUNT, (_, where?: Prisma.PlayerWhereInput) =>
    DatabaseClient.prisma.player.count({ where }),
  );
  ipcMain.handle(Constants.IPCRoute.TEAMS_ALL, (_, query?: Prisma.TeamFindManyArgs) =>
    DatabaseClient.prisma.team.findMany(query),
  );
  ipcMain.handle(Constants.IPCRoute.TEAMS_CREATE, (_, data: Prisma.TeamCreateInput) =>
    DatabaseClient.prisma.team.create({ data }),
  );
  ipcMain.handle(Constants.IPCRoute.TEAMS_UPDATE, (_, query: Prisma.TeamUpdateArgs) =>
    DatabaseClient.prisma.team.update(query),
  );
}
