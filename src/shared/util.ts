/**
 * Shared utility functions between main and renderer process.
 *
 * It is important to be careful with not importing any packages
 * specific to either platform as it may cause build failures.
 *
 * @module
 */
import type { Prisma } from '@prisma/client';
import { differenceBy, merge, set } from 'lodash';
import * as Constants from './constants';

/**
 * Builds team query from provided filters.
 *
 * @param federationId    Limit search to a specific federation.
 * @param countryId       Limit search to a specific country.
 * @param tier            Limit search to a specific tier.
 * @function
 */
export function buildTeamQuery(
  federationId?: number,
  countryId?: number,
  tier?: number,
): Prisma.TeamFindManyArgs {
  return {
    where: {
      ...(Number.isInteger(tier) ? { tier } : {}),
      country: {
        ...(countryId ? { id: countryId } : {}),
        ...(federationId
          ? {
              continent: {
                federationId,
              },
            }
          : {}),
      },
    },
  };
}

/**
 * Returns the replacement map for the selected
 * game variant, if one is found.
 *
 * Can optionally return the map in URI format which
 * can be used when passing to image components.
 *
 * @param map         The map to parse.
 * @param game        The selected game variant.
 * @param uri         Use uri format.
 * @function
 */
export function convertMapPool(map: (typeof Constants.MapPool)[number], game: string, uri = false) {
  // setup uri fragments
  const protocol = 'resources://maps/';
  const extension = (() => {
    switch (game) {
      case Constants.Game.CS16:
        return '.cs16.png';
      case Constants.Game.CSS:
        return '.css.png';
      case Constants.Game.CZERO:
        return '.cz.png';
      default:
        return '.png';
    }
  })();

  // find a replacement if any
  const replacement = Constants.MapPoolReplacements[game]?.[map] || map;
  return uri ? protocol + replacement + extension : replacement;
}

/**
 * @param result The result enum.
 * @function
 */
export function getResultTextColor(result: number) {
  return ['text-success', 'text-muted', 'text-error'][result];
}

/**
 * @param path The sorting property.
 * @param value The sorting value.
 * @function
 */
export function parseSortingDirection(path: string, value: unknown) {
  let direction: string | null;

  switch (value) {
    case 'asc':
      direction = 'desc';
      break;
    case 'desc':
      return null;
    default:
      direction = 'asc';
  }

  return set({}, path, direction);
}

/**
 * Implementation of sleep with promises.
 *
 * @function
 * @param ms Time in milliseconds to sleep for.
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Displays a whole number unless the
 * decimals are greater than 1.
 *
 * @param value The value.
 * @constant
 */
export function toOptionalDecimal(value: number) {
  return value.toFixed(2).replace(/[.,]00$/, '');
}

/**
 * Returns the ordinal suffix of the provided number.
 *
 * @param num The number to append the ordinal suffix to.
 * @function
 */
export function toOrdinalSuffix(num: string | number) {
  const int = parseInt(num as string);
  const digits = [int % 10, int % 100];
  const ordinals = ['st', 'nd', 'rd', 'th'];
  const oPattern = [1, 2, 3, 4];
  const tPattern = [11, 12, 13, 14, 15, 16, 17, 18, 19];
  return oPattern.includes(digits[0]) && !tPattern.includes(digits[1])
    ? int + ordinals[digits[0] - 1]
    : int + ordinals[3];
}

/**
 * Leverages `Intl.NumberFormat` to format numbers to currency.
 *
 * @param value The number to format.
 * @param opts  Number format options.
 * @function
 */
export function formatCurrency(value: number | string, opts?: Intl.NumberFormatOptions) {
  // setup base options
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    ...opts,
  };

  // convert string to number
  const num = typeof value === 'string' ? Number(value) : value;

  // only show decimals if necessary
  const formatter =
    num % 1 === 0
      ? new Intl.NumberFormat('en-US', {
          ...options,
          minimumFractionDigits: 0,
        })
      : new Intl.NumberFormat('en-US', options);

  // format the number
  return formatter.format(num);
}

/**
 * Returns the proper round description depending
 * on the number of matches left. For example:
 *
 * - RO16, Quarterfinals, Semifinals, Final
 * - Round xx
 *
 * @param round The current round number.
 * @param total The total number of matches in the current round.
 * @function
 */
export function parseCupRound(round: number, total: number) {
  switch (total) {
    case 16:
      return Constants.BracketRoundName.RO32;
    case 8:
      return Constants.BracketRoundName.RO16;
    case 4:
      return Constants.BracketRoundName.QF;
    case 2:
      return Constants.BracketRoundName.SF;
    case 1:
      return Constants.BracketRoundName.GF;
    default:
      return `Round ${round}`;
  }
}

/**
 * Similar to `parseCupRound` but returns the proper
 * round description based off of the _total_ number
 * of rounds in the entire tournament.
 *
 * @param round The current round number.
 * @param total The total number of rounds.
 * @function
 */
export function parseCupRounds(round: number, total: number) {
  switch (total - round) {
    case 4:
      return Constants.BracketRoundName.RO32;
    case 3:
      return Constants.BracketRoundName.RO16;
    case 2:
      return Constants.BracketRoundName.QF;
    case 1:
      return Constants.BracketRoundName.SF;
    case 0:
      return Constants.BracketRoundName.GF;
    default:
      return `Round ${round}`;
  }
}

/**
 * Loads user reported issues.
 *
 * @param issues The issues string.
 * @function
 */
export function loadIssues(issues: string | undefined) {
  return JSON.parse(issues || '[]') as Array<number>;
}

/**
 * Loads user settings by merging with
 * application default settings.
 *
 * @param settings The settings string.
 * @function
 */
export function loadSettings(settings: string) {
  return merge({}, Constants.Settings, JSON.parse(settings) as typeof Constants.Settings);
}

/**
 * Sanitizes a file name.
 *
 * @param fileName The file name to sanitize.
 * @function
 */
export function sanitizeFileName(fileName: string) {
  const sanitized = fileName.replace(/[<>:"/\\|?*]/g, '');
  return sanitized.replace(/^\.+|\s+$|\.+$/g, '');
}

/**
 * Builds the team's squad by going through their
 * starters first and then backfilling if needed.
 *
 * @param team        The team database record.
 * @param profile     The profile database record.
 * @param includeUser Whether to include the user in the squad.
 * @function
 */
export function getSquad(
  team: Prisma.TeamGetPayload<{ include: { players: { include: { country: true } } } }>,
  profile: Prisma.ProfileGetPayload<unknown>,
  includeUser = false,
) {
  // target length for this team (excluding the user)
  const size = Constants.GameSettings.SQUAD_STARTERS_NUM - +(team.id === profile.teamId);

  // ensure the squad does not include the user
  let squad = team.players.filter((player) => player.id !== profile.playerId);

  // build the squad using starters first
  const starters = squad.filter((player) => player.starter);

  // add on backfill if we do not meet size minimum
  if (starters.length < size) {
    squad = [...starters, ...differenceBy(squad, starters, 'id')];
  } else {
    squad = starters;
  }

  // trim to squad size and return
  return includeUser && team.id === profile.teamId
    ? [...squad.slice(0, size), team.players.find((player) => player.id === profile.playerId)]
    : squad.slice(0, size);
}

/**
 * Converts an integer to a letter of the alphabet.
 *
 * @param value The number to format.
 * @function
 */
export function toAlpha(value: number | string) {
  return String.fromCharCode(97 + (Number(value) - 1)).toUpperCase();
}

/**
 * Gets the formatted database name by the provided id.
 *
 * @param id The database id.
 * @method
 */
export function getSaveFileName(id: number) {
  return Constants.Application.DATABASE_NAME_FORMAT.replace('%s', String(id));
}
