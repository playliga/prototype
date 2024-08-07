/**
 * A wrapper module for `probability-picker`.
 *
 * @module
 */
import ProbabilityPick, { ProbabilityConfig } from 'probability-pick';

/**
 * Ensures that the passed distribution
 * table values do not exceed 100.
 *
 * If an `auto` value is found within, then
 * this function does not do anything.
 *
 * @param distribution Probability distribution table.
 * @function
 */
export function rangeToDistribution(distribution: ProbabilityConfig) {
  // bail early if an `auto` value was found
  if (Object.values(distribution).includes('auto')) {
    return distribution;
  }

  // convert distribution values to a percentage of the total sum
  const total = Object.values(distribution).reduce((a, b) => Number(a) + Number(b));
  const adjustedDistribution = {} as typeof distribution;

  Object.keys(distribution).forEach((key) => {
    adjustedDistribution[key] = Math.floor((Number(distribution[key]) / Number(total)) * 100);
  });

  // return a new object containing the
  // converted distribution values
  return adjustedDistribution;
}

/**
 * Picks an item at random.
 *
 * @param distribution Probability distribution table.
 * @function
 */
export function roll(distribution: ProbabilityConfig) {
  const pick = new ProbabilityPick(rangeToDistribution(distribution)).get();
  return pick.value as string;
}

/**
 * Rolls a two-sided die.
 *
 * @param goal The goal.
 * @function
 */
export function rollD2(goal: number) {
  const result = roll({
    true: goal,
    false: 'auto',
  });

  return result === 'true';
}

/**
 * Plucks an item from an array according
 * to the provided distribution config.
 *
 * The distribution config should be an
 * array mapping probability values to
 * the indices in the `from` array.
 *
 * @param from    The array to pluck from.
 * @param config  The probability distribution config.
 * @function
 */
export function pluck<T = object>(from: Array<T>, config: Array<number>) {
  // convert the passed array to a
  // valid probability config
  const pbxTable = from.reduce((prev, _, idx) => ({ ...prev, [idx]: config[idx] || 'auto' }), {});

  // pluck the index!
  return from[Number(roll(pbxTable))];
}
