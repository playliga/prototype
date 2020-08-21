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

  constructor() {
    this.middleware = [];
  }

  private async runMiddleware( item: any ) {
    const matchedm = this.middleware.filter( m => m.type === item.type );
    return Promise.all( matchedm.map( m => m.callback( item )) );
  }

  public async start( max: number ) {
    // bail if no `init` middleware was defined
    const initm = this.middleware.find( m => m.type === MiddlewareType.INIT );

    if( !initm ) {
      throw new Error( `'${MiddlewareType.INIT}' middleware type not found!` );
    }

    // grab the end middleware
    const endm = this.middleware.find( m => m.type === MiddlewareType.END );

    // grab the generic middleware
    const genericm = this.middleware.filter( m => !m.type );

    // run the middleware loop
    for( let i = 0; i < max; i++ ) {
      const items = await initm.callback();
      const results = await Promise.all( items.map( this.runMiddleware.bind( this ) ) );

      // run the generic middleware
      await Promise.all( genericm.map( m => m.callback( items ) ) );

      // do we need to bail out early?
      const bail = flatten( results ).findIndex( r => !r );

      if( bail > -1 ) {
        break;
      }

      // run end-loop middleware
      if( endm ) {
        await endm.callback();
      }
    }

    return Promise.resolve();
  }

  public register( type: string, callback: MiddlewareCallback ) {
    this.middleware.push({ type, callback });
  }
}
