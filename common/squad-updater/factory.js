// @flow

import cheerio from 'cheerio';
import adjectiveAnimal from 'adjective-animal';

import type { CheerioElement } from 'cheerio';

import { CachedScraper } from './';

export default class Factory {
  url: string
  cacheFilename: string
  scraperObj: CachedScraper

  constructor( url: string, cacheFilename: string | null = null, cacheDir: string | null = null ) {
    this.url = url;
    this.cacheFilename = cacheFilename || adjectiveAnimal.generateName();

    this.scraperObj = new CachedScraper( cacheDir );
    this.scraperObj.initCacheDir();
  }

  extractTeamURLs = ( data: string ): Array<Object> => {
    const $ = cheerio.load( data );
    const teamListElem = $( '#league-standings table tr[class*="row"]' );
    const outputArr = [];

    let divisionString = $( '#league-standings section.division h1' ).html();
    divisionString = divisionString.split( 'CS:GO' );

    teamListElem.each( ( counter: number, el: CheerioElement ) => {
      const teamContainerElem = $( el ).children( 'td:nth-child(2)' );
      const teamURL = teamContainerElem.children( 'a:nth-child(2)' ).attr( 'href' );

      outputArr.push({
        division: divisionString[ 1 ].trim(),
        placement: counter,
        url: teamURL.replace( /\./g, '&period[' )
      });
    });

    return outputArr;
  }

  generate = async (): Array<Object> => {
    // we know the site we're dealing with (ESEA) so massage the data accordingly

    // get the page content from the cached scraper
    let content;

    try {
      content = await this.scraperObj.scrape( this.url, this.cacheFilename );
    } catch( err ) {
      throw err;
    }

    // parse the page content and fetch the division URLs to fetch
    return this.extractTeamURLs( content );
  }
}