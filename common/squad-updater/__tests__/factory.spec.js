/* eslint-disable no-console */

import path from 'path';
import { Factory } from '../';

describe( 'factory', () => {
  it( 'generates an array of competitors from a specified website', async () => {
    const CACHE_DIR = path.join( __dirname, 'cache' );
    const factoryObj = new Factory( CACHE_DIR );
    factoryObj.scraperObj.setThrottleDelay( 100 );

    console.warn( await factoryObj.generate() );
  });
});