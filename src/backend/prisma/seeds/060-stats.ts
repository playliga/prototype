/**
 * Generates statistics data for players.
 *
 * @module
 */
import { generateStats } from 'cli/stats';

/**
 * The main seeder.
 *
 * @function
 */
export default async function () {
  await generateStats();
  return Promise.resolve();
}
