/**
 * Achievements seeder.
 *
 * @module
 */
import { Constants } from '@liga/shared';
import { PrismaClient } from '@prisma/client';

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  const transaction = Object.keys(Constants.Achievement).map((achievementId) =>
    prisma.achievement.create({
      data: {
        id: achievementId,
      },
    }),
  );

  return prisma.$transaction(transaction);
}
