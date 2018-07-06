/* eslint-disable no-console */

import { ScraperFactory } from '../';

describe( 'scraper factory', () => {
  it( 'throws an error if the generate method is not implemented.', async () => {
    const factoryObj = new ScraperFactory();

    expect( () => factoryObj.generate() ).toThrow( /method not implemented/ );
  });
});