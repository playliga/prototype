// @flow

import { CachedScraper } from './';

export default class Factory {
  url: string
  scraperObj: CachedScraper

  constructor( url: string, cacheDir: string | null = null ) {
    this.url = url;

    this.scraperObj = new CachedScraper( cacheDir );
    this.scraperObj.initCacheDir();
  }

  generate = (): void => {
    // what do i do now?
  }
}