/**
 * Creates the default profile.
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
  const count = await prisma.profile.count();

  if (count) {
    return;
  }

  return prisma.profile.create({
    data: {
      name: 'Default',
      date: new Date().toISOString(),
      settings: JSON.stringify(Constants.Settings),
    },
  });
}
