/* eslint-disable no-console */
import path from 'path';
import ESEA_CSGO_FREEAGENTS from '../esea-csgo-freeagents';

const CACHE_DIR = path.join( __dirname, 'cache' );

describe( 'esea_csgo free agents scraper', () => {
  it( 'generates free agents for the na and eu regions', async () => {
    // increase the default jest timeout
    // due to the async nature of this test
    jest.setTimeout( 500 );

    const eseacsgofa = new ESEA_CSGO_FREEAGENTS( CACHE_DIR );
    const res = await eseacsgofa.generate();
    const NA_PLAYERS = res.NA;
    const EU_PLAYERS = res.EU;

    NA_PLAYERS.forEach( ( player ) => {
      expect( player.id ).toBeDefined();
    });

    EU_PLAYERS.forEach( ( player ) => {
      expect( player.id ).toBeDefined();
    });

    expect( NA_PLAYERS.length ).toBeGreaterThan( 10 );
    expect( EU_PLAYERS.length ).toBeGreaterThan( 10 );
  });
});