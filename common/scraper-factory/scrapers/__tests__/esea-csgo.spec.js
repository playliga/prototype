/* eslint-disable no-console, import/first */
import path from 'path';
import ESEA_CSGO from '../esea-csgo';

const CACHE_DIR = path.join( __dirname, 'cache' );

describe( 'esea_csgo scraper', () => {
  it( 'generates a division and its teams and squads', async () => {
    jest.setTimeout( 30000 );

    // overwrite the default regions with just one for testing purposes
    // and also use only one division for that region
    const eseacsgo = new ESEA_CSGO( CACHE_DIR );
    const testRegion = eseacsgo.regions[ 0 ];

    testRegion.divisions = [ testRegion.divisions[ 0 ] ];
    eseacsgo.regions = [ testRegion ];

    const res = await eseacsgo.generate();
    res[ 0 ].divisions[ 0 ].teams.forEach( ( team, index ) => {
      console.log( `
        ${team.name}
        squad: ${team.squad.map( player => player.username ).join( ', ' )}
      ` );
    });
  });
});