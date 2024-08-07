/**
 * Generates transfer fees and wages for players.
 *
 * @module
 */
import { PrismaClient } from '@prisma/client';
import { Chance, Constants } from '@liga/shared';
import { random } from 'lodash';

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  const players = await prisma.player.findMany({
    where: {
      team: { isNot: null },
    },
    include: {
      team: true,
    },
  });

  const transaction = players.map((player) => {
    const tier = Constants.Prestige[player.team.prestige];
    const wageConfigs = Constants.PlayerWages[tier as keyof typeof Constants.PlayerWages];

    // no wages or cost for this
    // player's prestige level
    if (!wageConfigs) {
      return prisma.player.update({
        where: { id: player.id },
        data: { cost: 0, wages: 0 },
      });
    }

    // build probability weights
    const wagePbxWeight = {} as Parameters<typeof Chance.roll>[number];
    wageConfigs.forEach((weight, idx) => (wagePbxWeight[idx] = weight.percent));

    // pick the wage range for the player
    const wageConfigIdx = Chance.roll(wagePbxWeight);
    const wageConfig = wageConfigs[Number(wageConfigIdx)];

    // calculate cost from wage
    const wages = random(wageConfig.low, wageConfig.high);
    const cost = wages * wageConfig.multiplier;

    return prisma.player.update({
      where: { id: player.id },
      data: { cost, wages },
    });
  });

  return prisma.$transaction(transaction);
}
