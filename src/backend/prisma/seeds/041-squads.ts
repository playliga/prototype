/**
 * Adds free agents to teams so that they
 * can engage in the transfer market.
 *
 * @module
 */
import { PrismaClient } from '@prisma/client';
import { chunk, flatten, groupBy } from 'lodash';
import { Constants } from '@liga/shared';

/** @constant */
const federationInclude = {
  country: {
    include: {
      continent: {
        include: {
          federation: true,
        },
      },
    },
  },
};

/**
 * The main seeder.
 *
 * @param prisma  The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  const federations = await prisma.federation.findMany({
    where: {
      slug: {
        not: Constants.FederationSlug.ESPORTS_WORLD,
      },
    },
  });
  const allTeams = await prisma.team.findMany({
    include: federationInclude,
    where: {
      country: {
        continent: {
          federation: {
            id: {
              in: federations.map((federation) => federation.id),
            },
          },
        },
      },
    },
  });
  const allPlayers = await prisma.player.findMany({
    include: federationInclude,
    where: {
      teamId: null,
      country: {
        continent: {
          federation: {
            id: {
              in: federations.map((federation) => federation.id),
            },
          },
        },
      },
    },
  });
  const groups = groupBy(allPlayers, (player) => player.country.continent.federationId);
  const transaction = Object.keys(groups).map((federationId) => {
    const teams = allTeams.filter(
      (team) => team.country.continent.federationId === Number(federationId),
    );
    const players = allPlayers.filter(
      (player) => player.country.continent.federationId === Number(federationId),
    );
    const chunks = chunk(players, Math.floor(players.length / teams.length));
    return chunks
      .filter((_, chunkIdx) => !!teams[chunkIdx])
      .map((chunkData, chunkIdx) =>
        prisma.team.update({
          where: {
            id: teams[chunkIdx].id,
          },
          data: {
            players: {
              connect: chunkData.map((player) => ({ id: player.id })),
            },
          },
        }),
      );
  });

  return prisma.$transaction(flatten(transaction));
}
