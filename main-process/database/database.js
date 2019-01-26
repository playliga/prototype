// @flow
import path from 'path';
import Datastore from 'nedb';


const datastores = {
  continents: undefined,
  seeds: undefined
};


function _checkInstance(): boolean {
  // loop through all docs and check
  // if any are undefined
  const notloaded = Object.keys( datastores )
    .map( ( id: string ) => datastores[ id ] )
    .map( ( ds: Object | void ) => typeof ds === 'undefined' );

  // return true only if we did not find
  // any loaded docs
  return notloaded.length <= 0;
}


function _asyncLoadDatastore( dbpath: string, id: string ): Promise<*> {
  if( !datastores[ id ] ) {
    const filepath = path.join( dbpath, `${id}.db` );
    datastores[ id ] = new Datastore( filepath );
  }

  return new Promise( ( resolve: Function, reject: Function ) => {
    datastores[ id ].loadDatabase( ( err: Error ) => {
      if( err ) {
        reject( err );
      }

      resolve();
    });
  });
}


function _initdatastores( resolve: Function, reject: Function ): void {
  // `this` context is provided by the calling
  // by function using `.bind()`
  const promises = Object.keys( datastores )
    .map( ( id: string ) => _asyncLoadDatastore( this.dbpath, id ) );

  Promise.all( promises )
    .then( () => resolve( datastores ) )
    .catch( ( err: Error ) => reject( err ) );
}


export default class Database {
  dbpath: string

  constructor( dbpath: string ) {
    this.dbpath = dbpath;
  }

  static find( ds: Object, query: Object = {}): Promise<*> {
    return new Promise( ( resolve: Function, reject: Function ) => {
      ds.find( query, ( err: Error, res: any ) => {
        if( err ) {
          reject( err );
        }

        resolve( res );
      });
    });
  }

  static insert( ds: Object, doc: Object ): Promise<*> {
    return new Promise( ( resolve: Function, reject: Function ) => {
      ds.insert( doc, ( err: Error, newDoc: Object ) => {
        if( err ) {
          reject( err );
        }

        resolve( newDoc );
      });
    });
  }

  // in some cases it might be useful to know where all
  // of the datastores are located in the filesystem
  getDatastorePaths(): Array<string> {
    return (
      Object
        .keys( datastores )
        .map( ( id: string ) => path.join( this.dbpath, `${id}.db` ) )
    );
  }

  connect = (): Promise<*> => {
    // only load datastores if they
    // haven't been loaded already
    if( !_checkInstance() ) {
      return new Promise( _initdatastores.bind( this ) );
    }

    return Promise.resolve( datastores );
  }
}