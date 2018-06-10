// @flow

import { CacheManager } from './';

export default class Factory {
  url: string
  cacherObj: CacheManager

  constructor( url: string, cacheDir: string | null = null ) {
    this.url = url;

    this.cacherObj = new CacheManager( cacheDir );
    this.cacherObj.initCacheDir();
  }

  generate = (): void => {
    // what do i do now?
  }
}