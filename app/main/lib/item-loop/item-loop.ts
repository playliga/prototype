import { flatten } from 'lodash';


/**
 * Declare enums, types, and interfaces.
 */

export enum MiddlewareType {
  END = 'end',
  INIT = 'init',
}


interface MiddlewareCallback {
  ( data?: any ): Promise<any>;
}


interface Middleware {
  type?: string;
  callback: MiddlewareCallback;
}


/**
 * The Item Loop class.
 */

export class ItemLoop {
  private middleware: Middleware[];
  private bail: boolean;

  constructor() {
    this.middleware = [];
    this.bail = false;
  }

  private async runMiddleware( item: any ) {
    const matchedm = this.middleware.filter( m => m.type === item.type );
    return Promise.all( matchedm.map( m => m.callback( item )) );
  }

  public async start( max: number ) {
    // we're starting so set bail back to default
    this.bail = false;

    // bail if no `init` middleware was defined
    const initm = this.middleware.find( m => m.type === MiddlewareType.INIT );

    if( !initm ) {
      throw new Error( `'${MiddlewareType.INIT}' middleware type not found!` );
    }

    // grab the end middleware
    const endm = this.middleware.filter( m => m.type === MiddlewareType.END );

    // grab the generic middleware
    const genericm = this.middleware.filter( m => !m.type );

    // run the middleware loop
    for( let i = 0; i < max; i++ ) {
      const items = await initm.callback();
      const results = [
        ...await Promise.all( items.map( this.runMiddleware.bind( this ) ) ),
        ...await Promise.all( genericm.map( m => m.callback( items ) ) )
      ];

      // do we need to bail out early?
      const bail = flatten( results ).findIndex( r => r === false );

      if( bail > -1 || this.bail ) {
        break;
      }

      // run end-loop middleware
      if( endm ) {
        await Promise.all( endm.map( item => item.callback() ) );
      }
    }

    return Promise.resolve();
  }

  public register( type: string, callback: MiddlewareCallback ) {
    this.middleware.push({ type, callback });
  }

  public stop() {
    this.bail = true;
  }
}
