/* eslint-disable no-console */

import mock from 'mock-fs';
import fs from 'fs';
import path from 'path';

import { CacheManager } from '../';

// NOTE: workaround for a bug in mock-fs
// SEE: https://github.com/facebook/jest/issues/5792#issuecomment-376678248
console.log = jest.fn();

describe( 'cache manager', () => {
  beforeAll( () => {
    // declare config as a variable
    // to later add a key whose value is derived from a function
    const config = {
      '/var/': {/* empty directory */}
    };

    // add the parent directory as a path to test default path later
    config[ path.join( __dirname, '../' ) ] = {/* empty directory */};
    mock( config );
  });

  afterAll( () => {
    mock.restore();
  });

  it( 'creates cache directory in default path if it does not already exist', () => {
    const cacheManager = new CacheManager();
    cacheManager.initCacheDir();

    expect( fs.existsSync( path.join( __dirname, '../', 'cache' ) ) ).toBeTruthy();
  });

  it( 'creates cache directory in specified path if it does not already exist', () => {
    const cacheManager = new CacheManager( '/var/cache/' );
    cacheManager.initCacheDir();

    expect( fs.existsSync( '/var/cache' ) ).toBeTruthy();
  });
});