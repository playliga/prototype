/* eslint-disable no-console, import/first */
import path from 'path';
import ESEA_CSGO from '../esea-csgo';

const CACHE_DIR = path.join( __dirname, 'cache' );

describe( 'esea_csgo scraper', () => {
  it( 'creates cache directory in default path if it does not already exist', async () => {
    jest.setTimeout( 30000 );

    // overwrite the default regions with just one for testing purposes
    // and also use only one division for that region
    const eseacsgo = new ESEA_CSGO( CACHE_DIR );
    const testRegion = eseacsgo.regions[ 0 ];

    testRegion.divisions = [ testRegion.divisions[ 0 ] ];
    eseacsgo.regions = [ testRegion ];

    const res = await eseacsgo.generate();
    console.log( res[ 0 ].divisions[ 0 ].teams[ 0 ].squad );
  });
});