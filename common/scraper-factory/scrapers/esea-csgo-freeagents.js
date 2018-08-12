// @flow
import { camelCase } from 'lodash';
import cheerio from 'cheerio';
import type { CheerioElement } from 'cheerio';

import CachedScraper from '../cached-scraper';

type Regions = {
  [x: string]: Array<Object>
};

export default class ESEA_CSGO_FREEAGENTS {
  // @constants
  BASE_URL: string = 'https://play.esea.net?index.php?s=stats&d=overall';
  NA_REGION_ID: string = '&region_id=1';
  EU_REGION_ID: string = '&region_id=2';

  // @properties
  scraperObj: CachedScraper;
  regions: Regions;

  constructor( cacheDir: string ) {
    this.scraperObj = new CachedScraper( cacheDir );
    this.scraperObj.initCacheDir();

    this.regions = {
      NA: [],
      EU: []
    };
  }

  buildPlayerList = ( html: string ): Array<Object> => {
    const $ = cheerio.load( html );
    const playerListElem = $( '#layout-column-center table tr[class*="row"]' );
    const playerList = [];

    playerListElem.each( ( counter: number, el: CheerioElement ) => {
      const nameContainerElem = $( el ).children( 'td' ).first();
      const countryElem = $( nameContainerElem ).children( 'a' ).first().children( 'img' );
      const nameElem = $( nameContainerElem ).children( 'a:nth-child( 2 )' );

      // scrape the country code
      const index = countryElem.attr( 'src' ).indexOf( '.gif' );
      const countryCode = countryElem.attr( 'src' ).substring( index - 2, index );

      playerList.push({
        id: camelCase( nameElem.text() ),
        username: nameElem.text(),
        countryCode,
        transferValue: 0,
        skillTemplate: 'Easy', // TODO: maybe the topN guys are a skill above
        weaponTemplate: ( ( counter % 4 === 0 ) ? 'Sniper' : 'Rifle' )
      });
    });

    return playerList;
  }

  generate = async (): Promise<Regions> => {
    const { regions } = this;

    // build the NA region free agents
    try {
      const url = this.BASE_URL + this.NA_REGION_ID;
      const content = await this.scraperObj.scrape( url, 'na_freeagents' );
      regions.NA = this.buildPlayerList( content );
    } catch( err ) {
      throw err;
    }

    // build the EU region free agents
    try {
      const url = this.BASE_URL + this.EU_REGION_ID;
      const content = await this.scraperObj.scrape( url, 'eu_freeagents' );
      regions.EU = this.buildPlayerList( content );
    } catch( err ) {
      throw err;
    }

    return Promise.resolve( this.regions );
  }
}