// @flow
import path from 'path';
import { app } from 'electron';
import Datastore from 'nedb';


const datastores = {
  continents: undefined,
  seeds: undefined
};


export default class Database {
  dbpath: string

  constructor( dbpath: string | void = undefined ) {
    this.dbpath = !dbpath
      ? path.join( app.getPath( 'userData' ), 'databases' )
      : dbpath;
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

  _checkInstance = () => {
    // loop through all docs and check
    // if any are undefined
    const notloaded = Object.keys( datastores )
      .map( ( id: string ) => datastores[ id ] )
      .map( ( ds: Object | void ) => typeof ds === 'undefined' );

    // return true only if we did not find
    // any loaded docs
    return notloaded.length <= 0;
  }

  _asyncLoadDatastore = ( id: string ): Promise<*> => {
    if( !datastores[ id ] ) {
      const filepath = path.join( this.dbpath, `${id}.db` );
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

  _initdatastores = ( resolve: Function, reject: Function ): void => {
    const promises = Object.keys( datastores )
      .map( ( id: string ) => this._asyncLoadDatastore( id ) );

    Promise.all( promises )
      .then( () => resolve( datastores ) )
      .catch( ( err: Error ) => reject( err ) );
  }

  connect = (): Promise<*> => {
    // only load docs if they haven't
    // been loaded already
    if( !this._checkInstance() ) {
      return new Promise( this._initdatastores );
    }

    return Promise.resolve( datastores );
  }
}