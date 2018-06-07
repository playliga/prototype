// @flow

import path from 'path';
import fs from 'fs';
import cloudscraper from 'cloudscraper';
import glob from 'glob';

/*
* Cloudscraper is a tool used to scrape sites that are protected by cloudflare
* but unfortunately it does not return a promise. Here we're fixing that by
* wrapping cloudscraper in one. :)
*
* NOTE: delaying response by five seconds
* See: https://github.com/codemanki/cloudscraper#wat
*/
function scraper( url: string ): Promise<any> {
  return new Promise( ( resolve, reject ) => {
    cloudscraper.get( url, ( err, res, body ) => {
      setTimeout( () => resolve( body ), 5000 );
    });
  });
}

export default class CacheManager {
  cacheDir: string = path.join( __dirname, './cache' )

  constructor( cacheDir: string | null = null ) {
    this.cacheDir = cacheDir || this.cacheDir;
  }

  /*
  * Create cache directory if not already exists. It's fine to block execution
  * as we'd do the same thing if we were to do it async.
  */
  initCacheDir = () => {
    if( !fs.existsSync( this.cacheDir ) ) {
      fs.mkdirSync( this.cacheDir );
    }
  }

  /*
  * Search for specified division's cache files.
  * Useful for when deciding whether to fetch directly from website or not
  */
  checkFileCache = ( fileId: string ): Promise<any> => (
    new Promise( ( resolve, reject ) => {
      glob( `**/*+(${fileId}).html`, { cwd: this.cacheDir }, ( err, files ) => {
        resolve( files );
      });
    })
  )

  /*
  * Used when fetching the html of a page. Will first check to see if the
  * specified id was found in cache. If not, it will send the request and then
  * store the returned data in cache.
  */
  fetchFile = async ( url: string, fileId: string ): Promise<any> => {
    // Do we have a cached file to load from?
    const CACHE_FILENAME = `${Date.now()}_${fileId}.html`;
    const CACHE_FILELIST = await this.checkFileCache( fileId );

    if( CACHE_FILELIST.length > 0 ) {
      const body = fs.readFileSync( `${this.cacheDir}/${CACHE_FILELIST[ 0 ]}`, 'utf-8' );
      return Promise.resolve( body );
    }

    // If no cache, we can continue with making our request. After that's done
    // we save the data to cache
    const body = await scraper( url );
    fs.writeFileSync( `${this.cacheDir}/${CACHE_FILENAME}`, body );

    return Promise.resolve( body );
  }
}