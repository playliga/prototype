/**
 * Supported Counter-Strike versions.
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
  const transaction = Object.values(Constants.Game).map((slug) =>
    prisma.gameVersion.create({
      data: { slug },
    }),
  );

  return prisma.$transaction(transaction);
}
