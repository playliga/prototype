/**
 * Returns the proper round description depending
 * on the number of matches left. For example:
 *
 * - RO16, Quarterfinals, Semifinals, Final
 * - Round xx
 */

export function parseCupRound( round: any[] ) {
  switch( round.length ) {
    case 16:
      return 'RO32';
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


/**
 * If CS16 is enabled this function will return the replacement map
 * for those that do not exist in the game. Otherwise, it will
 * return the map that was originally passed to the function.
 */

export function parseMapForMatch( map: string, cs16_enabled = false ) {
  if( !cs16_enabled ) {
    return map;
  }

  const disabled = [ 'de_vertigo', 'de_overpass' ];
  const replacements = [ 'de_tuscan', 'de_cpl_mill' ];

  if( disabled.includes( map ) ) {
    return replacements[ disabled.findIndex( m => m === map ) ];
  }

  return map;
}


/**
 * Implementation of sleep with promises.
 */

export function snooze( ms: number ) {
  return new Promise( resolve => setTimeout( resolve, ms ) );
}


/**
 * Returns the ordinal suffix of the provided number.
 */

export function toOrdinalSuffix( num: string | number ) {
  const int = parseInt( num as string );
  const digits = [ int % 10, int % 100 ];
  const ordinals = [ 'st', 'nd', 'rd', 'th' ];
  const oPattern = [ 1, 2, 3, 4 ];
  const tPattern = [ 11, 12, 13, 14, 15, 16, 17, 18, 19 ];
  return oPattern.includes( digits[ 0 ] ) && !tPattern.includes( digits[ 1 ] )
    ? int + ordinals[ digits[ 0 ] - 1 ]
    : int + ordinals[ 3 ]
  ;
}
