/**
 * Returns the proper round description depending
 * on the number of matches left. For example:
 *
 * - RO16, Quarterfinals, Semifinals, Final
 * - Round xx
 */

export function parseCupRound( round: any[] ) {
  switch( round.length ) {
    case 8:
      return 'RO16';
    case 4:
      return 'Quarterfinals';
    case 2:
      return 'Semifinals';
    case 1:
      return 'Grand Final';
    default:
      return `Round ${round[ 0 ].id.r}`;
  }
}
