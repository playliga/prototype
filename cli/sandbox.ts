/**
 * A sandbox module for testing common
 * library functions via CLI.
 *
 * @module
 */
import os from 'node:os';
import path from 'node:path';
import util from 'node:util';
import fs from 'node:fs';
import log from 'electron-log';
import AppInfo from 'package.json';
import { Command } from 'commander';
import { addDays } from 'date-fns';
import { camelCase, random, sample, upperFirst } from 'lodash';
import { Bot, Constants, Eagers, Util } from '@liga/shared';
import {
  DatabaseClient,
  Worldgen,
  Simulator,
  Game,
  FileManager,
  Firebase,
  GitHub,
  Plugins,
  Mods,
  VDF,
  VPK,
} from '@liga/backend/lib';

/**
 * Default arguments.
 *
 * @constant
 */
const DEFAULT_ARGS = {
  game: Constants.Game.CS16,
  spectate: false,
};

/**
 * Worldgen sandbox subcommand.
 *
 * @function
 */
async function sandboxWorldgen() {
  const profile = await DatabaseClient.prisma.profile.create({
    data: {
      name: 'lemonpole',
      date: new Date(
        new Date().getFullYear(),
        Constants.Application.SEASON_START_MONTH,
        Constants.Application.SEASON_START_DAY,
      ),
      season: 1,
      settings: JSON.stringify(Constants.Settings),
    },
  });
  await DatabaseClient.prisma.team.create({
    data: {
      name: 'CHUMBUCKET',
      slug: 'chumbucket',
      blazon: '009515.png',
      prestige: Constants.Prestige.findIndex(
        (prestige) => prestige === Constants.TierSlug.LEAGUE_OPEN,
      ),
      country: {
        connect: {
          id: 77,
        },
      },
      players: {
        connect: [1208, 1210, 1227, 1228, 1236].map((id) => ({ id })),
        create: [
          {
            name: 'lemonpole',
            profile: {
              connect: {
                id: profile.id,
              },
            },
            country: {
              connect: {
                id: 77,
              },
            },
          },
        ],
      },
      personas: {
        create: [
          {
            name: 'Henrik Larsson',
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

  await Worldgen.createCompetitions();
  const entries = await DatabaseClient.prisma.calendar.findMany({
    where: {
      type: Constants.CalendarEntry.COMPETITION_START,
    },
  });
  await Promise.all(entries.map(Worldgen.onCompetitionStart));
  return Promise.resolve();
}

/**
 * Score simulation sandbox subcommand.
 *
 * @function
 */
async function sandboxScore() {
  const home = await DatabaseClient.prisma.team.findFirst({
    where: {
      prestige: Constants.Prestige.findIndex(
        (prestige) => prestige === Constants.TierSlug.LEAGUE_OPEN,
      ),
    },
    include: { players: true },
  });
  const away = await DatabaseClient.prisma.team.findFirst({
    where: {
      prestige: Constants.Prestige.findIndex(
        (prestige) => prestige === Constants.TierSlug.LEAGUE_PREMIER,
      ),
    },
    include: { players: true },
  });

  const iterations = 10;
  const simulator = new Simulator.Score();
  log.info([...Array(iterations)].map(() => simulator.generate([home, away])));
  return Promise.resolve();
}

/**
 * Simulates playing a match.
 *
 * @param args CLI args.
 * @function
 */
async function sandboxGame(args?: typeof DEFAULT_ARGS) {
  const profile = await DatabaseClient.prisma.profile.findFirst();
  const entry = await DatabaseClient.prisma.calendar.findFirst({
    where: {
      date: profile.date,
      type: Constants.CalendarEntry.MATCHDAY_USER,
    },
  });
  const match = await DatabaseClient.prisma.match.findFirst({
    where: {
      id: Number(entry.payload),
    },
    include: Eagers.match.include,
  });
  const gs = new Game.Server(profile, match, args.game, args.spectate);
  return gs.start();
}

/**
 * Sends and parses a transfer offer
 *
 * @function
 */
async function sandboxTransfer() {
  const profile = await DatabaseClient.prisma.profile.findFirst();

  // grab the team to make an offer to
  const targetTeam = await DatabaseClient.prisma.team.findFirst({
    where: {
      prestige: Constants.Prestige.findIndex(
        (prestige) => prestige === Constants.TierSlug.LEAGUE_PREMIER,
      ),
    },
    include: {
      players: true,
    },
  });
  log.info('Picked %s.', targetTeam.name);

  // grab random player to make an offer
  const target = sample(targetTeam.players);
  log.info('Sending offer to %s (%s)...', target.name, Util.formatCurrency(target.cost));

  // send an offer
  const transfer = await DatabaseClient.prisma.transfer.create({
    include: { offers: true },
    data: {
      status: Constants.TransferStatus.TEAM_PENDING,
      from: {
        connect: {
          id: profile.teamId,
        },
      },
      to: {
        connect: {
          id: target.teamId,
        },
      },
      target: {
        connect: {
          id: target.id,
        },
      },
      offers: {
        create: [
          {
            status: Constants.TransferStatus.TEAM_PENDING,
            cost: random(0, target.cost),
            wages: random(0, target.wages),
          },
        ],
      },
    },
  });

  log.info('Offer sent for %s.', Util.formatCurrency(transfer.offers[0].cost));
  log.info('Wages: %s.', Util.formatCurrency(transfer.offers[0].wages));

  // offer will be parsed next day
  const entry = await DatabaseClient.prisma.calendar.create({
    data: {
      type: Constants.CalendarEntry.TRANSFER_PARSE,
      date: addDays(profile.date, 1).toISOString(),
      payload: String(transfer.id),
    },
  });

  // run through the simulation
  return Worldgen.onTransferOffer(entry);
}

/**
 * Tests the file-manager module.
 *
 * @function
 */
async function sandboxFileManager() {
  const profile = await DatabaseClient.prisma.profile.findFirst();
  const settings = Util.loadSettings(profile.settings);
  const cwd = path.join(
    settings.general.steamPath,
    Constants.GameSettings.CS16_BASEDIR,
    Constants.GameSettings.CS16_GAMEDIR,
  );
  return FileManager.restore(cwd);
}

/**
 * Tests firebase rest api module.
 *
 * @function
 */
async function sandboxFirebase() {
  const profile = await DatabaseClient.prisma.profile.findFirst();
  const settings = Util.loadSettings(profile.settings);
  const saveFilePath = DatabaseClient.path;
  const appLogsPath = log.transports.file.getFile().path;
  const gameLogsPath = await Game.getGameLogFile(settings.general.game, settings.general.gamePath);
  const firebase = new Firebase.Storage(
    process.env.FIREBASE_CLIENT_EMAIL,
    process.env.FIREBASE_KEY_ID,
    process.env.FIREBASE_PROJECT_ID,
  );
  const zipPath = path.join(os.tmpdir(), Util.sanitizeFileName(profile.name));
  const files = [saveFilePath, saveFilePath + '-wal', appLogsPath, gameLogsPath];

  try {
    await fs.promises.access(zipPath, fs.constants.F_OK);
  } catch (_) {
    await fs.promises.mkdir(zipPath);
  }

  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.promises.access(file, fs.constants.F_OK);
        await fs.promises.copyFile(file, path.join(zipPath, path.basename(file)));
      } catch (_) {
        log.warn('%s not found. skipping...', file);
        return Promise.resolve();
      }
    }),
  );

  const zip = await FileManager.compress(zipPath, true);
  return firebase.upload(zip);
}

/**
 * Tests bot training module.
 *
 * @function
 */
async function sandboxTraining() {
  const profile = await DatabaseClient.prisma.profile.findFirst<typeof Eagers.profile>();
  for (const player of profile.team.players) {
    const xp = new Bot.Exp(player);
    const totalSessions = 5;
    for (let i = 0; i < totalSessions; i++) {
      xp.train();
    }
    break;
  }
}

/**
 * Tests github module.
 *
 * @function
 */
async function sandboxGithub() {
  new GitHub.Application(process.env.GH_ISSUES_CLIENT_ID, AppInfo.repository.url);
  return Promise.resolve();
}

/**
 * Tests the plugin-manager module.
 *
 * @function
 */
async function sandboxPluginManager() {
  const plugins = new Plugins.Manager('https://github.com/playliga/plugins.git');
  plugins.checkForUpdates();
}

/**
 * Tests the plugin-manager module.
 *
 * @function
 */
async function sandboxModManager() {
  const mods = new Mods.Manager('https://github.com/playliga/mods.git');
  log.info(await mods.all());

  await mods.download('retro-strike');
  await mods.extract();
  await mods.delete();
}

/**
 * Tests the VDF module.
 *
 * @function
 */
async function sandboxVdf() {
  const profile = await DatabaseClient.prisma.profile.findFirst();
  const settings = Util.loadSettings(profile.settings);
  const librariesFileContent = await fs.promises.readFile(
    path.join(settings.general.steamPath, Constants.GameSettings.STEAM_LIBRARIES_FILE),
    'utf8',
  );
  const { libraryfolders } = VDF.parse(librariesFileContent);
  log.debug(libraryfolders);
  const library = Object.values(libraryfolders).find((folder: Record<string, unknown>) => {
    return Object.keys(folder.apps).includes(String(Constants.GameSettings.CSGO_APPID));
  }) as Record<string, unknown>;
  log.debug(library);
}

/**
 * Tests the VPK module.
 *
 * @function
 */
async function sandboxVpk() {
  const profile = await DatabaseClient.prisma.profile.findFirst();
  const settings = Util.loadSettings(profile.settings);

  const gameDir = path.join(
    settings.general.gamePath,
    Constants.GameSettings.CS2_BASEDIR,
    Constants.GameSettings.CS2_GAMEDIR,
  );

  // create the temp folder we'll be making the VPK from
  const vpkSource = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'liga-testing', 'liga'));

  // copy bot profile
  const botProfilePath = path.join(gameDir, Constants.GameSettings.CS2_BOT_CONFIG);

  try {
    await fs.promises.copyFile(botProfilePath, path.join(vpkSource, path.basename(botProfilePath)));
  } catch (error) {
    this.log.error(error);
  }

  // copy the language file with the patched bot prefix names
  const languageFileSource = path.join(
    Plugins.getPath(),
    Constants.Game.CS2,
    Constants.GameSettings.CSGO_LANGUAGE_FILE,
  );
  const languageFileTarget = path.join(vpkSource, Constants.GameSettings.CSGO_LANGUAGE_FILE);
  await FileManager.touch(languageFileTarget);
  await fs.promises.copyFile(languageFileSource, languageFileTarget);

  // generate the vpk
  const startTime = performance.now();
  const vpk = new VPK.Parser(vpkSource);
  await vpk.create();
  const endTime = performance.now();
  log.debug(`Function execution time: ${endTime - startTime} ms`);
}

/**
 * Validates the provided sandbox type and runs it.
 *
 * @param type The type of sandbox to run.
 * @param args CLI args.
 * @function
 */
export async function handleSandboxType(type: string, args: typeof DEFAULT_ARGS) {
  // set up database client
  await DatabaseClient.connect(1);

  // bail early if provided sandbox
  // type is not supported
  const acceptedSandboxTypes = [
    'worldgen',
    'score',
    'game',
    'transfer',
    'file-manager',
    'firebase',
    'training',
    'github',
    'plugin-manager',
    'mod-manager',
    'vdf',
    'vpk',
  ];
  const sandboxFns: Record<
    string,
    | typeof sandboxWorldgen
    | typeof sandboxScore
    | typeof sandboxGame
    | typeof sandboxTransfer
    | typeof sandboxFileManager
    | typeof sandboxFirebase
    | typeof sandboxTraining
    | typeof sandboxGithub
    | typeof sandboxPluginManager
    | typeof sandboxModManager
    | typeof sandboxVdf
    | typeof sandboxVpk
  > = {
    sandboxWorldgen,
    sandboxScore,
    sandboxGame,
    sandboxTransfer,
    sandboxFileManager,
    sandboxFirebase,
    sandboxTraining,
    sandboxGithub,
    sandboxPluginManager,
    sandboxModManager,
    sandboxVdf,
    sandboxVpk,
  };

  if (!acceptedSandboxTypes.includes(type)) {
    return Promise.reject('Unknown sandbox type.');
  }

  // dynamically call the scraper function
  try {
    const sandboxFn = util.format('sandbox%s', upperFirst(camelCase(type)));
    await sandboxFns[sandboxFn]({ ...DEFAULT_ARGS, ...args });
    return DatabaseClient.prisma.$disconnect();
  } catch (error) {
    log.error(error);
    return DatabaseClient.prisma.$disconnect();
  }
}

/**
 * Exports this module.
 *
 * @exports
 */
export default {
  /**
   * Registers this module's CLI.
   *
   * @param program CLI parser.
   * @function
   */
  register: (program: Command) => {
    program
      .command('sandbox')
      .description('A sandbox module for testing common library functions.')
      .argument('<type>', 'The type of sandbox to run.')
      .option('-g --game <name>', 'The name of the game.', DEFAULT_ARGS.game)
      .option('-s --spectate', 'Spectate the game.', DEFAULT_ARGS.spectate)
      .action(handleSandboxType);
  },
};
