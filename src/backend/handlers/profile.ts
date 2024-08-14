/**
 * Profile IPC handlers.
 *
 * @module
 */
import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import log from 'electron-log';
import { ipcMain } from 'electron';
import { glob } from 'glob';
import { sample, sampleSize } from 'lodash';
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Bot, Constants, Eagers } from '@liga/shared';
import { DatabaseClient, Game, WindowManager } from '@liga/backend/lib';

/** @interface */
interface ProfileCreateIPCPayload {
  user?: Partial<Prisma.PlayerGetPayload<unknown>>;
  team?: Partial<Prisma.TeamGetPayload<unknown>>;
  squad?: Array<Prisma.PlayerGetPayload<typeof Eagers.player>>;
  today?: Date;
}

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  // xp bonus handlers
  ipcMain.handle(Constants.IPCRoute.BONUS_ALL, () => DatabaseClient.prisma.bonus.findMany());
  ipcMain.handle(Constants.IPCRoute.BONUS_BUY, async (_, id: number) => {
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const bonus = await DatabaseClient.prisma.bonus.findFirst({ where: { id } });
    await DatabaseClient.prisma.profile.update({
      where: {
        id: profile.id,
      },
      data: {
        earnings: {
          decrement: bonus.cost,
        },
        bonuses: {
          connect: {
            id,
          },
        },
      },
    });

    // send profile update to renderer
    const mainWindow = WindowManager.get(Constants.WindowIdentifier.Main, false)?.webContents;

    if (mainWindow) {
      mainWindow.send(
        Constants.IPCRoute.PROFILES_CURRENT,
        await DatabaseClient.prisma.profile.findFirst(),
      );
    }

    return Promise.resolve();
  });

  // profile management handlers
  ipcMain.handle(Constants.IPCRoute.PROFILES_CREATE, async (_, data: ProfileCreateIPCPayload) => {
    // grab free xp bonuses to assign to user's profile
    const bonuses = await DatabaseClient.prisma.bonus.findMany({
      where: {
        cost: null,
      },
    });

    // grab free agents for the user's team from their chosen federation
    const country = await DatabaseClient.prisma.country.findFirst({
      where: {
        id: data.team.countryId,
      },
      include: {
        continent: true,
      },
    });
    const freeAgents = await DatabaseClient.prisma.player.findMany({
      where: {
        teamId: null,
        country: {
          continent: {
            federationId: country.continent.federationId,
          },
        },
      },
    });
    const squad = sampleSize(freeAgents, Constants.Application.SQUAD_MIN_LENGTH);

    // save the user's profile, team, and create their player
    const profile = await DatabaseClient.prisma.profile.create({
      data: {
        name: data.team.name,
        date: data.today.toISOString(),
        settings: JSON.stringify(Constants.Settings),
        bonuses: {
          connect: bonuses,
        },
      },
    });
    const team = await DatabaseClient.prisma.team.create({
      data: {
        name: data.team.name,
        slug: data.team.name,
        blazon: data.team.blazon,
        prestige: Constants.Prestige.findIndex(
          (prestige) => prestige === Constants.TierSlug.LEAGUE_OPEN,
        ),
        tier: Constants.Prestige.findIndex(
          (prestige) => prestige === Constants.TierSlug.LEAGUE_OPEN,
        ),
        country: {
          connect: {
            id: data.team.countryId,
          },
        },
        players: {
          connect: squad.map((player: Prisma.PlayerGetPayload<unknown>) => ({
            id: player.id,
          })),
          create: [
            {
              name: data.user.name,
              profile: {
                connect: {
                  id: profile.id,
                },
              },
              country: {
                connect: {
                  id: data.user.countryId,
                },
              },
            },
          ],
        },
        personas: {
          create: [
            {
              name: `${faker.name.firstName()} ${faker.name.lastName()}`,
              role: Constants.PersonaRole.ASSISTANT,
            },
          ],
        },
        profile: {
          connect: {
            id: profile.id,
          },
        },
      },
    });

    // set the starters
    await DatabaseClient.prisma.player.updateMany({
      where: {
        profile: null,
        teamId: team.id,
      },
      data: {
        starter: true,
      },
    });

    // replace an existing team with user's team so
    // they get picked up by the autofill module
    //
    // grab teams from same federation as user's team
    const [continent] = await DatabaseClient.prisma.continent.findMany({
      where: {
        countries: {
          some: {
            id: team.countryId,
          },
        },
      },
    });
    const teams = await DatabaseClient.prisma.team.findMany({
      select: {
        id: true,
      },
      where: {
        prestige: Constants.Prestige.findIndex(
          (prestige) => prestige === Constants.TierSlug.LEAGUE_OPEN,
        ),
        country: {
          continent: {
            federationId: continent.federationId,
          },
        },
      },
    });

    // pick a random team and set their prestige and tier to null
    const teamToReplace = sample(teams);
    await DatabaseClient.prisma.team.update({
      where: {
        id: teamToReplace.id,
      },
      data: {
        prestige: null,
        tier: null,
      },
    });

    // discover steam path
    const settings = JSON.parse(profile.settings) as typeof Constants.Settings;

    if (!settings.general.steamPath) {
      settings.general.steamPath = await Game.discoverSteamPath();
    }

    // discover game path only if steam is installed
    if (settings.general.steamPath && !settings.general.gamePath) {
      try {
        settings.general.gamePath = await Game.discoverGamePath(
          settings.general.game,
          settings.general.steamPath,
        );
      } catch (error) {
        log.warn(error.message);
      }
    }

    // update the settings
    return DatabaseClient.prisma.profile.update({
      where: { id: profile.id },
      data: { settings: JSON.stringify(settings) },
    });
  });
  ipcMain.handle(Constants.IPCRoute.PROFILES_CURRENT, () =>
    DatabaseClient.prisma.profile.findFirst(),
  );
  ipcMain.handle(Constants.IPCRoute.PROFILES_TRAIN, async (_, bonusIds: Array<number>) => {
    const profile = await DatabaseClient.prisma.profile.findFirst(Eagers.profile);
    const bonuses = await DatabaseClient.prisma.bonus.findMany({ where: { id: { in: bonusIds } } });

    // train players first
    await DatabaseClient.prisma.$transaction(
      profile.team.players.map((player) => {
        const xp = new Bot.Exp(JSON.parse(player.stats), bonuses);
        const gains = player.gains ? JSON.parse(player.gains) : {};
        xp.train();

        // append today's gains to the current player total
        Object.keys(xp.gains).forEach((stat) => {
          if (!gains[stat]) {
            gains[stat] = 0;
          }
          gains[stat] += xp.gains[stat];
        });

        return DatabaseClient.prisma.player.update({
          where: { id: player.id },
          data: {
            stats: JSON.stringify(xp.stats),
            gains: JSON.stringify(gains),
          },
        });
      }),
    );

    // and then update the profile record to rehydrate
    // the cache with updated player stats and gains
    return DatabaseClient.prisma.profile.update({
      where: { id: profile.id },
      data: {
        trainedAt: profile.date,
      },
    });
  });
  ipcMain.handle(Constants.IPCRoute.PROFILES_UPDATE, async (_, query: Prisma.ProfileUpdateArgs) => {
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const settings = JSON.parse(profile.settings) as typeof Constants.Settings;
    const newSettings = JSON.parse(query.data.settings as string) as typeof Constants.Settings;

    // reload logging level if that was updated
    if (newSettings.general.logLevel !== settings.general.logLevel) {
      log.transports.console.level = newSettings.general.logLevel as log.LogLevel;
      log.transports.file.level = newSettings.general.logLevel as log.LogLevel;
    }

    // rediscover game path if game mode was updated
    if (newSettings.general.game !== settings.general.game && settings.general.steamPath) {
      try {
        newSettings.general.gamePath = await Game.discoverGamePath(
          newSettings.general.game,
          newSettings.general.steamPath,
        );
      } catch (error) {
        log.warn(error.message);
      }
    }

    // update the profile
    await DatabaseClient.prisma.profile.update({
      ...query,
      data: {
        settings: JSON.stringify(newSettings),
      },
    });

    // send profile update to renderer
    const mainWindow = WindowManager.get(Constants.WindowIdentifier.Main, false)?.webContents;

    if (mainWindow) {
      mainWindow.send(
        Constants.IPCRoute.PROFILES_CURRENT,
        await DatabaseClient.prisma.profile.findFirst(),
      );
    }

    return Promise.resolve(profile);
  });

  // save files management handlers
  ipcMain.handle(Constants.IPCRoute.SAVES_ALL, async () => {
    // build response
    const saves = [];

    // have to normalize the path for glob to work
    const files = await glob('save_*.db', {
      cwd: path.normalize(DatabaseClient.basePath),
    });

    // sequentially connect to each and get profile data
    for (const file of files) {
      // grab database id from filename
      const [databaseId] = Array.from(file.matchAll(/save_(\d+)\.db/g), (groups) => groups[1]);

      // bail if filename does not match
      if (!databaseId) {
        continue;
      }

      // connect to existing save db
      await DatabaseClient.prisma.$disconnect();
      DatabaseClient.connect(parseInt(databaseId));

      // grab profile data from db and set id to match filename
      const profileData = await DatabaseClient.prisma.profile.findFirst();

      if (profileData) {
        profileData.id = parseInt(databaseId);
      }

      saves.push(profileData);
    }

    // reconnect to root save
    await DatabaseClient.prisma.$disconnect();
    DatabaseClient.connect();

    // filter out null values from saves list
    return Promise.resolve(saves.filter((save) => !!save));
  });
  ipcMain.handle(Constants.IPCRoute.SAVES_CREATE, (_, id: number) => {
    const newSaveName = util.format(Constants.Application.DATABASE_NAME_FORMAT, id);
    const newSavepath = path.join(DatabaseClient.basePath, newSaveName);

    // bail early if there is already a
    // save file for the provided id
    if (fs.existsSync(newSavepath)) {
      return Promise.reject();
    }

    // create copy of root save
    const rootSaveName = util.format(Constants.Application.DATABASE_NAME_FORMAT, String(0));
    const rootSavePath = path.join(DatabaseClient.basePath, rootSaveName);
    return fs.promises.copyFile(rootSavePath, newSavepath);
  });
  ipcMain.handle(Constants.IPCRoute.SAVES_DELETE, (_, id: number) => {
    const dbFileName = util.format(Constants.Application.DATABASE_NAME_FORMAT, id);
    const dbPath = path.join(DatabaseClient.basePath, dbFileName);

    if (!fs.existsSync(dbPath)) {
      return Promise.reject();
    }

    return fs.promises.unlink(dbPath);
  });

  // squad management
  ipcMain.handle(Constants.IPCRoute.SQUAD_ALL, async () => {
    const profile = await DatabaseClient.prisma.profile.findFirst<typeof Eagers.profile>();
    return profile.team.players;
  });
  ipcMain.handle(Constants.IPCRoute.SQUAD_UPDATE, async (_, query: Prisma.PlayerUpdateArgs) => {
    const { id: profileId } = await DatabaseClient.prisma.profile.findFirst();
    const profile = await DatabaseClient.prisma.profile.update<typeof Eagers.profile>({
      where: { id: profileId },
      data: {
        team: {
          update: {
            players: {
              update: query,
            },
          },
        },
      },
    });
    return profile.team.players;
  });
}
