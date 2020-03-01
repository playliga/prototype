import path from 'path';


export default class ScraperFactory {
  public innerFactoryObj: ScraperFactory;

  constructor( cacheDir: string, scraperName: string ) {
    // try to dynamically load `scraperName` via file
    const factoryObj = require(
      path.join( __dirname, 'scrapers', `${scraperName}.ts` )
    ).default;
    this.innerFactoryObj = new factoryObj( cacheDir );
  }

  public generate = ( args: unknown = '' ): Promise<unknown> => {
    if( typeof this.innerFactoryObj.generate !== 'function' ) {
      throw new Error( 'Factory `generate()` method not implemented.' );
    }

    return this.innerFactoryObj.generate( args );
  }
}
