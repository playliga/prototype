/**
 * Assigns elo to teams per their prestige.
 *
 * @module
 */
import { PrismaClient } from '@prisma/client';
import { Constants } from '@liga/shared';

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  const teams = await prisma.team.findMany();
  const transaction = teams.map((team) =>
    prisma.team.update({
      where: {
        id: team.id,
      },
      data: {
        elo:
          Constants.EloRatings[Constants.Prestige[team.tier]] ??
          Constants.EloRatings[Constants.TierSlug.LEAGUE_OPEN],
      },
    }),
  );
  return prisma.$transaction(transaction);
}
