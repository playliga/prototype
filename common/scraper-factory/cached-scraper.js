// @flow

import path from 'path';
import fs from 'fs';
import cloudscraper from 'cloudscraper';
import glob from 'glob';
import { promisify } from 'util';

export default class CachedScraper {
  cacheDir: string = path.join( __dirname, './cache' )
  scraperThrottleDelay: number = 8000

  constructor( cacheDir: string | null = null ) {
    this.cacheDir = cacheDir || this.cacheDir;
  }

  setThrottleDelay( num: number ): void {
    this.scraperThrottleDelay = num;
  }

  /*
  * Create cache directory if not already exists. It's fine to block execution
  * as we'd do the same thing if we were to do it async.
  */
  initCacheDir = (): void => {
    if( !fs.existsSync( this.cacheDir ) ) {
      fs.mkdirSync( this.cacheDir );
    }
  }

  /*
  * Search for specified cache file.
  * Useful for when deciding whether to fetch directly from website or not
  */
  getCachedFile = async ( filename: string ): Promise<Array<string>> => {
    const globPromise = promisify( glob );
    const result = await globPromise( `**/*+(${filename}).html`, { cwd: this.cacheDir });

    if( result.length === 0 ) {
      throw new Error( 'Specified file id not found' );
    }

    return result;
  }

  /*
  * Cloudscraper is a tool used to scrape sites that are protected by cloudflare
  * but unfortunately it does not return a promise. Here we're fixing that by
  * wrapping cloudscraper in one. :)
  *
  * NOTE: delaying response by X-amount of seconds
  * See: https://github.com/codemanki/cloudscraper#wat
  */
  delayedScraper = ( url: string ): Promise<string> => (
    new Promise( ( resolve: Function, reject: Function ) => {
      cloudscraper.get( url, ( err, res, body: string ) => {
        if( err ) {
          reject( err );
        } else {
          setTimeout( () => resolve( body ), this.scraperThrottleDelay );
        }
      });
    })
  )

  /*
  * Used when fetching the html of a page. Will first check to see if the
  * specified id was found in cache. If not, it will send the request and then
  * store the returned data in cache.
  */
  scrape = async ( url: string, filename: string ): Promise<string> => {
    // Do we have a cached file to load from?
    const CACHE_FILENAME = `${Date.now()}_${filename}.html`;

    try {
      const filelist = await this.getCachedFile( filename );
      const body = fs.readFileSync( `${this.cacheDir}/${filelist[ 0 ]}`, 'utf-8' );

      return Promise.resolve( body );
    } catch( err ) {
      // file not found, continue
    }

    // If no cache, we can continue with making our request.
    // After that's done, we save the data to cache
    try {
      const body = await this.delayedScraper( url );
      fs.writeFileSync( `${this.cacheDir}/${CACHE_FILENAME}`, body );

      return Promise.resolve( body );
    } catch( err ) {
      return Promise.reject( err );
    }
  }
}