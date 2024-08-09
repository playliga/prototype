/**
 * Shared utility functions between main and renderer process.
 *
 * It is important to be careful with not importing any packages
 * specific to either platform as it may cause build failures.
 *
 * @module
 */
import * as Constants from './constants';

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
      default:
        return '.png';
    }
  })();

  // find a replacement if any
  const replacement = Constants.MapPoolReplacements[game]?.[map] || map;
  return uri ? protocol + replacement + extension : replacement;
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
 * @function
 */
export function formatCurrency(value: number | string) {
  // setup base options
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
  };

  // convert string to number
  const num = typeof value === 'string' ? Number(value) : value;

  // only show decimals if necessary
  const formatter =
    num % 1 === 0
      ? new Intl.NumberFormat('en-US', {
          ...opts,
          minimumFractionDigits: 0,
        })
      : new Intl.NumberFormat('en-US', opts);

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
