/**
 * Default map pools per game.
 *
 * @module
 */
import { PrismaClient } from '@prisma/client';
import { flatten } from 'lodash';
import { Constants } from '@liga/shared';

/** @constant */
const data: Record<Constants.Game, Array<string>> = {
  [Constants.Game.CS16]: [
    // active
    'de_cpl_mill',
    'de_dust2',
    'de_inferno',
    'de_cpl_strike',
    'de_nuke',
    'de_train',
    'de_cbble',

    // reserve
    'de_cache',
    'de_cpl_fire',
    'de_overpass',
    'de_tuscan',
    'de_vertigo',
    'de_russka',
  ],
  [Constants.Game.CS2]: [
    // active
    'de_ancient',
    'de_dust2',
    'de_inferno',
    'de_mirage',
    'de_nuke',
    'de_overpass',
    'de_train',

    // reserve
    'de_vertigo',
  ],
  [Constants.Game.CSGO]: [
    // active
    'de_ancient',
    'de_dust2',
    'de_inferno',
    'de_mirage',
    'de_nuke',
    'de_overpass',
    'de_anubis',

    // reserve
    'de_cache',
    'de_train',
  ],
  [Constants.Game.CSS]: [
    'de_cbble',
    'de_cpl_strike',
    'de_dust2',
    'de_inferno',
    'de_nuke',
    'de_russka',
    'de_train',
  ],
  [Constants.Game.CZERO]: [
    'de_cbble_cz',
    'de_czl_freight',
    'de_czl_karnak',
    'de_czl_silo',
    'de_dust2_cz',
    'de_inferno_cz',
    'de_russka_cz',
  ],
};

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  const gameMaps = await prisma.gameMap.findMany();
  const gameVersions = await prisma.gameVersion.findMany();
  const transaction = Object.keys(data).map((gameVersionSlug: Constants.Game) =>
    data[gameVersionSlug].map((gameMapName, gameMapPosition) =>
      prisma.mapPool.create({
        data: {
          gameMapId: gameMaps.find((gameMap) => gameMap.name === gameMapName).id,
          gameVersionId: gameVersions.find((gameVersion) => gameVersion.slug === gameVersionSlug)
            .id,
          position: gameMapPosition < 7 ? gameMapPosition : null,
        },
      }),
    ),
  );

  return prisma.$transaction(flatten(transaction));
}
