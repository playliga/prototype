/**
 * All supported maps.
 *
 * @module
 */
import { PrismaClient } from '@prisma/client';

/** @constant */
const data = [
  'de_ancient',
  'de_anubis',
  'de_cache',
  'de_cbble',
  'de_cpl_mill',
  'de_cpl_strike',
  'de_czl_freight',
  'de_czl_karnak',
  'de_czl_silo',
  'de_dust2',
  'de_dust2_cz',
  'de_inferno',
  'de_inferno_cz',
  'de_mirage',
  'de_nuke',
  'de_overpass',
  'de_russka',
  'de_russka_cz',
  'de_train',
  'de_tuscan',
  'de_vertigo',
];

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  const transaction = data.map((name) =>
    prisma.gameMap.create({
      data: { name },
    }),
  );

  return prisma.$transaction(transaction);
}
