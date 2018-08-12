/* eslint-disable no-console */
import path from 'path';
import ESEA_CSGO_FREEAGENTS from '../esea-csgo-freeagents';

const CACHE_DIR = path.join( __dirname, 'cache' );

describe( 'esea_csgo free agents scraper', () => {
  it( 'generates free agents for the na and eu regions', async () => {
    // increase the default jest timeout
    // due to the async nature of this test
    jest.setTimeout( 30000 );

    const eseacsgofa = new ESEA_CSGO_FREEAGENTS( CACHE_DIR );
    console.log( await eseacsgofa.generate() );
  });
});