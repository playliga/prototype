/**
 * Bot experience points module that is used to train the individual
 * stats of a particular bot template as defined in `botprofile.db`.
 *
 * @module
 */
import * as Chance from './chance';
import log from 'electron-log';
import type { Prisma } from '@prisma/client';
import { random, sampleSize } from 'lodash';

/**
 * Individual bot template stats.
 *
 * @interface
 */
interface Stats extends Record<string, number> {
  skill: number;
  aggression: number;
  reactionTime: number;
  attackDelay: number;
}

/**
 * Bot skill template definition.
 *
 * @interface
 */
interface Template {
  difficulty: number;
  name: string;
  prestige: number;
  multiplier: number;
  stats: Stats;
}

/**
 * Idiomatic bot difficulty names.
 *
 * @enum
 */
enum Difficulty {
  EASY = 'Easy',
  FAIR = 'Fair',
  NORMAL = 'Normal',
  TOUGH = 'Tough',
  HARD = 'Hard',
  VERY_HARD = 'VeryHard',
  EXPERT = 'Expert',
  ELITE = 'Elite',
}

/**
 * Certain stats are better when you
 * subtract instead of add to them.
 *
 * @constant
 */
export const StatModifiers = {
  SUBTRACT: ['reactionTime', 'attackDelay'],
};

/**
 * Bot difficulty progression table.
 *
 * These values were derived from CS 1.6 bot templates
 * in order for this app to also support CS 1.6.
 *
 * @constant
 */
export const Templates: Array<Template> = [
  {
    name: Difficulty.EASY,
    prestige: 0,
    multiplier: 1,
    difficulty: 0,
    stats: {
      skill: 1,
      aggression: 20,
      reactionTime: 0.5,
      attackDelay: 1.5,
    },
  },
  {
    name: Difficulty.FAIR,
    prestige: 1,
    multiplier: 2,
    difficulty: 1,
    stats: {
      skill: 25,
      aggression: 30,
      reactionTime: 0.4,
      attackDelay: 1.0,
    },
  },
  {
    name: Difficulty.NORMAL,
    prestige: 1,
    multiplier: 2,
    difficulty: 1,
    stats: {
      skill: 50,
      aggression: 50,
      reactionTime: 0.4,
      attackDelay: 0.7,
    },
  },
  {
    name: Difficulty.TOUGH,
    prestige: 2,
    multiplier: 4,
    difficulty: 2,
    stats: {
      skill: 60,
      aggression: 60,
      reactionTime: 0.3,
      attackDelay: 0.35,
    },
  },
  {
    name: Difficulty.HARD,
    prestige: 2,
    multiplier: 5,
    difficulty: 2,
    stats: {
      skill: 75,
      aggression: 75,
      reactionTime: 0.25,
      attackDelay: 0,
    },
  },
  {
    name: Difficulty.VERY_HARD,
    prestige: 3,
    multiplier: 10,
    difficulty: 3,
    stats: {
      skill: 80,
      aggression: 80,
      reactionTime: 0.25,
      attackDelay: 0,
    },
  },
  {
    name: Difficulty.EXPERT,
    prestige: 4,
    multiplier: 18,
    difficulty: 3,
    stats: {
      skill: 90,
      aggression: 90,
      reactionTime: 0.2,
      attackDelay: 0,
    },
  },
  {
    name: Difficulty.ELITE,
    prestige: 4,
    multiplier: 20,
    difficulty: 3,
    stats: {
      skill: 100,
      aggression: 100,
      reactionTime: 0.2,
      attackDelay: 0,
    },
  },
];

/**
 * XP distribution probability table.
 *
 * @note
 * The key is the total xp that can be gained.
 * The value is its probability weight.
 *
 * @example
 * When training, the Skill stat has a 99%
 * chance of gaining 1 XP. And a 1% chance
 * of gaming 3 XP.
 *
 * @constant
 */
const GainsPbxWeight: Record<keyof Stats, Record<string, number>> = {
  skill: {
    '1': 99,
    '3': 1,
  },
  aggression: {
    '1': 99,
    '3': 1,
  },
  reactionTime: {
    '-.01': 99,
    '-.05': 1,
  },
  attackDelay: {
    '-.01': 99,
    '-.05': 1,
  },
};

/**
 * Bot experience points class.
 *
 * @class
 */
export class Exp {
  public gains: Partial<Stats>;
  public stats: Stats;
  private bonuses: typeof this.gains;
  private log: log.LogFunctions;

  constructor(stats?: Stats, bonuses?: Array<Prisma.BonusGetPayload<unknown>>) {
    // load base stats if none are provided
    if (!stats) {
      stats = Templates[0].stats;
    }

    // create a shallow clone of provided stats
    this.stats = { ...stats };

    // initialize objects
    this.bonuses = {};
    this.gains = {};
    this.log = log.scope('training');

    // initialize training bonuses
    if (bonuses) {
      bonuses.forEach(this.initBonuses, this);
    }
  }

  /**
   * Calculates the sum of the stats to be
   * represented as experience points.
   *
   * @function
   * @param stats The stats object.
   */
  public static getTotalXP(stats?: Stats) {
    if (!stats) {
      return 0;
    }

    return Object.keys(stats)
      .map((key) => stats[key])
      .reduce((total, current) => total + current);
  }

  /**
   * Grabs the maximum amount of experience
   * points that can be attained.
   *
   * @function
   */
  public static getMaximumXP() {
    const [lastTemplate] = Templates.slice(-1);
    return Exp.getTotalXP(lastTemplate.stats);
  }

  /**
   * Grabs the maximum amount of experience points
   * that can be attained for a specific stat.
   *
   * @function
   * @param name The name of the stat.
   */
  public static getMaximumXPForStat(name: string) {
    const [lastTemplate] = Templates.slice(-1);
    return lastTemplate.stats[name];
  }

  /**
   * Trains an array of player records.
   *
   * @param players The array of players to train.
   * @param bonuses Training bonuses to apply.
   * @function
   */
  public static trainAll(
    players: Array<Prisma.PlayerGetPayload<unknown>>,
    bonuses?: Array<Prisma.BonusGetPayload<unknown>>,
  ) {
    return players.map((player) => {
      const xp = new Exp(JSON.parse(player.stats), bonuses);
      const gains = player.gains ? JSON.parse(player.gains) : {};
      xp.train();

      // append gains to the current player total
      Object.keys(xp.gains).forEach((stat) => {
        if (!gains[stat]) {
          gains[stat] = 0;
        }
        gains[stat] += xp.gains[stat];
      });

      return {
        ...player,
        xp: {
          stats: JSON.stringify(xp.stats),
          gains: JSON.stringify(gains),
        },
      };
    });
  }

  /**
   * Grab stats that can still be trained.
   *
   * @function
   */
  private get trainable() {
    const [maxTemplate] = Templates.slice(-1);

    return Object.keys(this.stats).filter((key) =>
      StatModifiers.SUBTRACT.includes(key)
        ? this.stats[key] > maxTemplate.stats[key]
        : this.stats[key] < maxTemplate.stats[key],
    );
  }

  /**
   * A bonus object contains bonuses for specific stats.
   *
   * Appends the provided bonus object to the instance
   * object tracking current bonuses.
   *
   * @param bonus The bonus object.
   * @function
   */
  private initBonuses(bonus: Prisma.BonusGetPayload<unknown>) {
    const stats = JSON.parse(bonus.stats) as Partial<Stats>;

    Object.keys(stats).forEach((stat) => {
      if (!this.trainable.includes(stat)) {
        return;
      }

      if (!this.bonuses[stat]) {
        this.bonuses[stat] = 0;
      }

      this.bonuses[stat] += Number(stats[stat]);
    });
  }

  /**
   * Gets the current bot difficulty template based
   * off of this instance's active stats.
   *
   * @function
   */
  public getBotTemplate() {
    // clamp total xp to maximum possible xp
    const [maxTemplate] = Templates.slice(-1);
    const totalXp = Exp.getTotalXP(this.stats);

    if (totalXp >= Exp.getTotalXP(maxTemplate.stats)) {
      return maxTemplate;
    }

    // otherwise use the sum of the stats
    // to isolate the template
    const [found] = Templates.filter(
      (template, idx) =>
        totalXp > Exp.getTotalXP(Templates[idx - 1]?.stats) &&
        totalXp <= Exp.getTotalXP(template.stats),
    );

    // return our result
    return found;
  }

  /**
   * Randomly pick from list of stats that can still
   * be trained for the current bot difficulty.
   *
   * @function
   */
  public train() {
    // randomly pick stats to train
    const [lastTemplate] = Templates.slice(-1);
    const drills = sampleSize(this.trainable, random(1, this.trainable.length));

    this.log.debug('beginning training on %s', drills);
    this.log.debug('training bonuses: %s', this.bonuses);

    // run some drills
    drills.forEach((drill) => {
      const gains = Number(Chance.roll(GainsPbxWeight[drill]));
      const bonus = gains * this.bonuses[drill];
      const total = gains < 0 ? gains + (bonus || 0) : Math.round(gains + (bonus || 0));
      this.stats[drill] += total;
      this.gains[drill] = total;

      // clamp gains to maximum xp possible
      if (
        (gains < 0 && this.stats[drill] < lastTemplate.stats[drill]) ||
        (gains > 0 && this.stats[drill] > lastTemplate.stats[drill])
      ) {
        this.log.debug('clamping %s to %d', drill, lastTemplate.stats[drill]);
        this.stats[drill] = lastTemplate.stats[drill];
      }

      this.log.debug(
        'trained %s. base: %d, bonus: %d, total: %d',
        drill,
        gains.toFixed(2),
        bonus.toFixed(2),
        total.toFixed(2),
      );
    });
  }
}
