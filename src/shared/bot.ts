/**
 * Bot experience points module that is used to train the individual
 * stats of a particular bot template as defined in `botprofile.db`.
 *
 * @module
 */
import * as Chance from './chance';
import * as Constants from './constants';
import log from 'electron-log';
import type { Prisma } from '@prisma/client';
import { random } from 'lodash';

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
    name: Constants.BotDifficulty.EASY,
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
    name: Constants.BotDifficulty.FAIR,
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
    name: Constants.BotDifficulty.NORMAL,
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
    name: Constants.BotDifficulty.TOUGH,
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
    name: Constants.BotDifficulty.HARD,
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
    name: Constants.BotDifficulty.VERY_HARD,
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
    name: Constants.BotDifficulty.EXPERT,
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
    name: Constants.BotDifficulty.ELITE,
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
    '2': 1,
  },
  aggression: {
    '1': 99,
    '2': 1,
  },
  reactionTime: {
    '-.001': 99,
    '-.003': 1,
  },
  attackDelay: {
    '-.001': 99,
    '-.003': 1,
  },
};

/**
 * Probability table for how likely a stat is to be trained.
 *
 * @constant
 */
const StatsPbxWeight: Stats = {
  skill: 15,
  aggression: 15,
  reactionTime: 75,
  attackDelay: 75,
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
  private player: Prisma.PlayerGetPayload<unknown>;

  constructor(player: typeof this.player, bonuses?: Array<Prisma.BonusGetPayload<unknown>>) {
    this.log = log.scope('training');
    this.stats = player.stats ? JSON.parse(player.stats) : { ...Templates[0].stats };
    this.gains = player.gains ? JSON.parse(player.gains) : {};
    this.player = player;

    // initialize training bonuses
    this.bonuses = {};

    if (bonuses) {
      bonuses.forEach(this.initBonuses, this);
    }
  }

  /**
   * Randomizes and returns the stats
   * for the specified bot template.
   *
   * @param name The name of the bot template.
   * @function
   */
  public static getRandomStats(name: string) {
    const templateIdx = Templates.findIndex((template) => template.name === name);
    const template = Templates[templateIdx];
    const minTemplate = Templates[Math.max(1, templateIdx - 1)];
    const maxTemplate = Templates[Math.min(Templates.length - 1, templateIdx + 1)];

    Object.keys(template.stats).forEach((key) => {
      template.stats[key] = random(minTemplate.stats[key], maxTemplate.stats[key]);
    });

    return template.stats;
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
      const xp = new Exp(player, bonuses);
      xp.train();

      return {
        ...player,
        xp: {
          stats: JSON.stringify(xp.stats),
          gains: JSON.stringify(xp.gains),
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
    const idx = Templates.findIndex((template) => template.prestige === this.player.prestige);
    const maxTemplate = Templates[idx + 1] || Templates[idx];
    return Object.keys(this.stats).filter((key) =>
      StatModifiers.SUBTRACT.includes(key)
        ? this.stats[key] > maxTemplate.stats[key]
        : this.stats[key] < maxTemplate.stats[key],
    );
  }

  /**
   * Calculates the stats and gains by adjusting
   * values for inverted stats by normalizing
   * and clamping them into a [0,1] range.
   *
   * @param stat The stat to normalize.
   * @function
   */
  public normalize(stat: string) {
    let gain = this.gains[stat];
    let value = this.stats[stat];
    let max: string | number = Exp.getMaximumXPForStat(stat);

    if (StatModifiers.SUBTRACT.includes(stat)) {
      const min = Templates[0].stats[stat];
      const valueNormalized = (value - min) / (max - min);
      const valueClamped = Math.max(0, Math.min(1, valueNormalized));
      const gainNormalized = gain / (max - min);
      value = Number(valueClamped.toFixed(2));
      gain = -gainNormalized;
      max = Number(1).toFixed(2);
    }

    return {
      gain,
      value,
      max,
    };
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
    const drills = Chance.pluckMultiple(
      this.trainable,
      this.trainable.map((stat) => StatsPbxWeight[stat]),
    );

    if (!drills.length) {
      this.log.debug('[%s] nothing to train', this.player.name);
      return;
    }

    this.log.debug('[%s] beginning training on %s', this.player.name, drills);
    this.log.debug('[%s] training bonuses: %s', this.player.name, this.bonuses);

    // run some drills
    drills.forEach((drill) => {
      const gains = Number(Chance.roll(GainsPbxWeight[drill]));
      const bonus = gains * this.bonuses[drill];
      const total = gains < 0 ? gains + (bonus || 0) : Math.round(gains + (bonus || 0));
      this.stats[drill] += total;

      // gains may not be initialized as they are reset
      // every season so make sure it defaults to zero
      this.gains[drill] = (this.gains[drill] || 0) + total;

      // clamp gains to maximum xp possible
      if (
        (gains < 0 && this.stats[drill] < lastTemplate.stats[drill]) ||
        (gains > 0 && this.stats[drill] > lastTemplate.stats[drill])
      ) {
        this.log.debug('clamping %s to %d', drill, lastTemplate.stats[drill]);
        this.stats[drill] = lastTemplate.stats[drill];
      }

      this.log.debug('[%s] trained %s. %o', this.player.name, drill, {
        base: gains.toFixed(3),
        bonus: bonus.toFixed(3),
        total: total.toFixed(3),
      });
    });
  }
}
