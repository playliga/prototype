// @flow
/* eslint-disable import/no-dynamic-require */

import path from 'path';


export default class ScraperFactory {
  innerFactoryObj: Object

  constructor( cacheDir: string, scraperName: string ) {
    // try to dynamically load `scraperName` via file
    try {
      // $FlowSkip
      const factoryObj = require(
        path.join( __dirname, 'scrapers', `${scraperName}.js` )
      ).default;
      this.innerFactoryObj = new factoryObj( cacheDir );
    } catch( err ) {
      throw err;
    }
  }

  generate = (): Promise<any> => {
    if( typeof this.innerFactoryObj.generate !== 'function' ) {
      throw new Error( 'Factory `generate()` method not implemented.' );
    }

    return this.innerFactoryObj.generate();
  }
}