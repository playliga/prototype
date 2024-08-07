/**
 * Assigns a random blazon to every team in the database.
 *
 * @module
 */
import path from 'path';
import log from 'electron-log';
import { glob } from 'glob';
import { sample } from 'lodash';
import { PrismaClient } from '@prisma/client';

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  const teams = await prisma.team.findMany();

  const blazonry = await glob('*.png', {
    cwd: path.normalize(path.join(process.env.INIT_CWD, 'src/resources/blazonry')),
  });

  if (!blazonry.length) {
    log.warn('No Blazonry was found. Skipping.');
    return Promise.resolve();
  }

  const transaction = teams.map((team) =>
    prisma.team.update({
      where: { id: team.id },
      data: {
        blazon: sample(blazonry),
      },
    }),
  );

  return prisma.$transaction(transaction);
}
