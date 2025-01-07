/**
 * Provides XP bonuses to gains from training and additionally
 * ensures that the specified stat is trained.
 *
 * The values are multiplied against the total amount
 * of gains for that specific statistic.
 *
 * @module
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { Constants } from '@liga/shared';

/** @constant */
export const data: Array<Prisma.BonusCreateInput> = [
  {
    type: Constants.BonusType.SERVER,
    name: 'Shared 1',
    stats: JSON.stringify({ skill: 1 }),
  },
  {
    type: Constants.BonusType.SERVER,
    name: 'Shared 2',
    stats: JSON.stringify({ aggression: 1 }),
  },
  {
    type: Constants.BonusType.SERVER,
    name: 'Private 1',
    stats: JSON.stringify({ skill: 1, aggression: 1 }),
    cost: 12_000,
  },
  {
    type: Constants.BonusType.SERVER,
    name: 'Private 2',
    stats: JSON.stringify({ reactionTime: 1, attackDelay: 1 }),
    cost: 12_000,
  },
  {
    type: Constants.BonusType.SERVER,
    name: 'Premium 1',
    stats: JSON.stringify({ skill: 2, aggression: 2 }),
    cost: 24_000,
  },
  {
    type: Constants.BonusType.SERVER,
    name: 'Premium 2',
    stats: JSON.stringify({ reactionTime: 2, attackDelay: 2 }),
    cost: 24_000,
  },
  {
    type: Constants.BonusType.MAP,
    name: 'de_dust2',
    stats: JSON.stringify({ skill: 1 }),
  },
  {
    type: Constants.BonusType.MAP,
    name: 'de_inferno',
    stats: JSON.stringify({ aggression: 1 }),
  },
  {
    type: Constants.BonusType.MAP,
    name: 'de_mirage',
    stats: JSON.stringify({ reactionTime: 1 }),
  },
  {
    type: Constants.BonusType.MAP,
    name: 'de_nuke',
    stats: JSON.stringify({ attackDelay: 1 }),
  },
  {
    type: Constants.BonusType.MAP,
    name: 'de_overpass',
    stats: JSON.stringify({ reactionTime: 1 }),
  },
  {
    type: Constants.BonusType.MAP,
    name: 'de_train',
    stats: JSON.stringify({ aggression: 1 }),
  },
  {
    type: Constants.BonusType.MAP,
    name: 'de_tuscan',
    stats: JSON.stringify({ skill: 1 }),
  },
  {
    type: Constants.BonusType.FACILITY,
    name: 'Small Training Facility',
    stats: JSON.stringify({ skill: 1, aggression: 1, reactionTime: 1, attackDelay: 1 }),
    cost: 250_000,
  },
  {
    type: Constants.BonusType.FACILITY,
    name: 'Esports Arena',
    stats: JSON.stringify({ skill: 4, aggression: 4, reactionTime: 4, attackDelay: 4 }),
    cost: 750_000,
  },
];

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  // build the transaction
  const transaction = data.map((bonus) =>
    prisma.bonus.upsert({
      where: { name: bonus.name },
      update: {
        type: bonus.type,
        name: bonus.name,
        stats: bonus.stats,
        cost: bonus.cost,
      },
      create: {
        type: bonus.type,
        name: bonus.name,
        stats: bonus.stats,
        cost: bonus.cost,
      },
    }),
  );

  // run the transaction
  return prisma.$transaction(transaction);
}
