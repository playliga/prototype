/**
 * Populates the database with teams and players.
 *
 * @module
 */
import log from 'electron-log';
import { PrismaClient } from '@prisma/client';
import { Constants } from '@liga/shared';
import { scrape } from 'cli/scraper';

/**
 * The main seeder.
 *
 * @param prisma  The prisma client.
 * @param args    CLI args.
 * @function
 */
export default async function (prisma: PrismaClient, args: Record<string, string>) {
  // bail if no token was provided
  if (!args.token) {
    log.warn('Pandascore access token not found. Skipping.');
    return Promise.resolve();
  }

  // figure out the total number of teams to scrape by
  // adding up the size of every federation's tier
  const federationsCount = await prisma.federation.count();
  const tiers = await prisma.tier.findMany({
    where: {
      league: {
        slug: Constants.LeagueSlug.ESPORTS_LEAGUE,
      },
    },
  });
  const totalRequiredTeams = tiers.reduce((total, tier) => total + tier.size * federationsCount, 0);

  // run the scrapers
  await scrape('teams', {
    batchLimit: Math.floor(totalRequiredTeams / 4).toString(),
    batchSize: (totalRequiredTeams / 2).toString(),
    num: totalRequiredTeams.toString(),
    token: args.token,
  });
  await scrape('free-agents', {
    batchLimit: '50',
    batchSize: '100',
    num: '100',
    token: args.token,
  });

  return Promise.resolve();
}
