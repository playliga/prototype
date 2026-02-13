/**
 * Player Stats Generator.
 *
 * @module
 */
import log from 'electron-log';
import { Command } from 'commander';
import { random } from 'lodash';
import { PrismaClient } from '@prisma/client';
import { Bot } from '@liga/shared';

/** @interface */
interface CLIArguments {
  min?: string;
  max?: string;
}

/**
 * Initialize the local prisma client.
 *
 * @constant
 */
const prisma = new PrismaClient();

/**
 * Default scraper arguments.
 *
 * @constant
 */
const DEFAULT_ARGS: CLIArguments = {
  min: '1',
  max: '5',
};

/**
 * Generates XP for all players in the database.
 *
 * @function
 * @param args CLI args.
 */
export async function generateStats(args?: typeof DEFAULT_ARGS) {
  // merge args
  const mergedArgs = { ...DEFAULT_ARGS, ...args };

  // grab all players to train
  const profile = await prisma.profile.findFirst();
  const players = await prisma.player.findMany();
  log.info('Generating Stats for %s Players...', players.length);

  // train and store as queries
  const queries = players.map((player) => {
    // randomly pick the amount of training sessions
    // allocated to this particular player
    const xp = new Bot.Exp(player, null, profile.date);
    const totalSessions = random(Number(mergedArgs.min), Number(mergedArgs.max));

    for (let i = 0; i < totalSessions; i++) {
      xp.train();
    }

    // update the player stats
    return prisma.player.update({
      where: { id: player.id },
      data: {
        stats: JSON.stringify(xp.stats),
        gains: JSON.stringify(xp.gains),
      },
    });
  });

  // run transaction and return
  await prisma.$transaction(queries);
  return Promise.resolve();
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
   * @function
   * @param program CLI parser.
   */
  register: (program: Command) => {
    program
      .command('stats')
      .option('--min <num>', 'Minumum amount of training sessions per iteration', DEFAULT_ARGS.min)
      .option('--max <num>', 'Maximum amount of training sessions per iteration', DEFAULT_ARGS.max)
      .description('Generates XP for all players in the database.')
      .action(generateStats);
  },
};
