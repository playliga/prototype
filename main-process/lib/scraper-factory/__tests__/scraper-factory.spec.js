/* eslint-disable no-console */

import path from 'path';
import ScraperFactory from '../scraper-factory';

const CACHE_DIR = path.join( __dirname, 'cache' );

// TODO: could probably mock this instead...
class FakeInnerFactory {
  // burp
}

describe( 'scraper factory', () => {
  it( 'throws an error if the specified scraper is not found', () => {
    expect( () => new ScraperFactory( CACHE_DIR, 'nonexistent' ) )
      .toThrow( /Cannot find module/ );
  });

  it( 'returns an instance of a subclass based off of name', () => {
    const factoryObj = new ScraperFactory( CACHE_DIR, 'esea-csgo' );
    expect( factoryObj.innerFactoryObj ).toBeDefined();
  });

  it( 'throws an error if the inner scraper factory is missing a generate function', () => {
    const factoryObj = new ScraperFactory( CACHE_DIR, 'esea-csgo' );

    // for testing purposes, overwrite the inner factory object
    // with our fake one that is missing the generate function
    factoryObj.innerFactoryObj = new FakeInnerFactory();

    expect( () => factoryObj.generate() ).toThrow( /method not implemented/ );
  });
});