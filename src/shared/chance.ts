/**
 * A wrapper module for `probability-picker`.
 *
 * @see https://github.com/lukigarazus/probability-pick
 * @module
 */

/** @type {RecursiveProbability} */
type RecursiveProbability<Probability> = {
  config: ProbabilityConfigGen<Probability>;
  probability: Probability;
};

/** @type {Probability} */
type Probability = 'auto' | number;

/** @type {ProbabilityConfigGenKey} */
type ProbabilityConfigGenKey = string | number;

/** @type {ProbabilityConfigGenValue} */
type ProbabilityConfigGenValue<Probability> = Probability | RecursiveProbability<Probability>;

/** @type {ProbabilityConfigGen} */
type ProbabilityConfigGen<Probability> = {
  [key in ProbabilityConfigGenKey]: ProbabilityConfigGenValue<Probability>;
};

/** @type {ProbabilityConfig} */
type ProbabilityConfig = ProbabilityConfigGen<Probability>;

/** @type {ProbabilityArray} */
type ProbabilityArray = ProbabilityArrayElement[];

/** @interface */
interface ProbabilityArrayElement {
  start: number;
  end: number;
  value: (string | number) | ProbabilityArrayElement[];
}

/**
 * @param config The config.
 * @function
 */
function refineConfig(config: ProbabilityConfigGen<Probability>) {
  const nums: string[] = [];
  const autos: string[] = [];
  const objects: string[] = [];

  Object.keys(config).forEach((key: string) => {
    const value = config[key];
    switch (typeof value) {
      case 'string':
        autos.push(key);
        break;
      case 'number':
        nums.push(key);
        break;
      case 'object':
        objects.push(key);
        switch (typeof (value as RecursiveProbability<Probability>).probability) {
          case 'string':
            autos.push(key);
            break;
          case 'number':
            nums.push(key);
        }
    }
  });

  const sum = nums
    .map(
      // @ts-expect-error: ported from original
      (key: string) => config[key].probability || (config[key] as number) || 0,
    )
    .reduce((acc: number, el: number) => acc + el, 0);

  const autoValue = (100 - sum) / autos.length;
  if (sum + (autoValue * autos.length || 0) > 100) {
    throw new Error('Invalid ad configuration');
  }

  autos.forEach((key: string) => {
    const value = config[key];
    switch (typeof value) {
      case 'object':
        value.probability = autoValue;
        break;
      case 'string':
        config[key] = autoValue;
        break;
    }
  });

  objects.forEach((key: string) => {
    refineConfig((config[key] as RecursiveProbability<Probability>).config);
  });
}

/**
 * @param obj The probability config object.
 * @function
 */
function createProbabilityArray(obj: ProbabilityConfigGen<number>): ProbabilityArray {
  const entries = Object.entries(obj);
  return entries.reduce(
    (
      acc: ProbabilityArray,
      ent: [ProbabilityConfigGenKey, ProbabilityConfigGenValue<number>],
      i: number,
    ) => {
      const prev = i ? acc[i - 1].end : 0;
      return [
        ...acc,
        {
          start: prev,
          end: prev + (typeof ent[1] === 'object' ? ent[1].probability : ent[1]),
          value: typeof ent[1] === 'object' ? createProbabilityArray(ent[1].config) : ent[0],
        },
      ];
    },
    [] as ProbabilityArray,
  );
}

/**
 * @param arr The probability array.
 * @function
 */
function getRandomElementWithProbability(arr: ProbabilityArray): ProbabilityArrayElement {
  const num = Math.random() * 100;
  const el = arr.find((el: ProbabilityArrayElement) => el.start <= num && el.end > num);
  // retry
  if (!el) {
    return getRandomElementWithProbability(arr);
  }
  if (Array.isArray(el.value)) {
    return getRandomElementWithProbability(el.value);
  }
  return el;
}

/** @class */
class ProbabilityPick {
  private probabilityArray: ProbabilityArray;

  constructor(config: ProbabilityConfigGen<Probability>) {
    refineConfig(config);
    this.probabilityArray = createProbabilityArray(config as ProbabilityConfigGen<number>);
  }

  get = () => {
    return getRandomElementWithProbability(this.probabilityArray);
  };
}

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
