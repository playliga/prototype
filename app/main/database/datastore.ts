import path from 'path';
import fs from 'fs';
import nedb from 'nedb';
import nedbinstances from './instances';
import { DatabaseRecord } from './types';


export default class Datastore {
  public basepath: string;
  public name: string;

  constructor( name: string, basepath = '' ) {
    this.name = name;
    this.basepath = basepath;
  }

  /**
   * override the getter method and
   * return the singleton instead
  **/
  get nedbinstance() {
    return nedbinstances[ this.name ];
  }

  get fullpath() {
    return path.join( this.basepath, `${this.name}.db` );
  }

  /**
   * Connects (loads) the datastore. This datastore is a
   * singleton instance so it returns if datastore
   * has already been loaded.
   *
   * @return Promise
  **/
  public connect(): Promise<void> {
    if( this.nedbinstance ) {
      return Promise.resolve();
    }

    // set the singleton object
    nedbinstances[ this.name ] = new nedb( this.fullpath );

    // if the database file does not exist,
    // then create it as an empty file
    if( !fs.existsSync( this.fullpath ) ) {
      fs.closeSync( fs.openSync( this.fullpath, 'w' ) );
    }

    return new Promise( ( resolve, reject ) => {
      this.nedbinstance.loadDatabase( ( err: any ) => {
        if( err ) {
          reject( err );
        }

        resolve();
      });
    });
  }

  /**
   * Resyncs the database by running nedb's `compactdatafile`
   * function. It promisify's it by completing the async
   * task once the `compaction.done` event is triggered.
   *
   * Under the hood nedb uses an append-only format. Meaning
   * that all updates and deletes actually result in lines
   * added at the end of the datafile.
   *
   * https://github.com/louischatriot/nedb#persistence
   *
   * @return Promise
   */
  public resync(): Promise<void> {
    if( !this.nedbinstance ) {
      throw new Error( 'Datastore not instantiated!' );
    }

    return new Promise( resolve => {
      this.nedbinstance.persistence.compactDatafile();
      this.nedbinstance.on(
        'compaction.done',
        () => resolve()
      );
    });
  }

  public find( query = {}): Promise<DatabaseRecord[]> {
    if( !this.nedbinstance ) {
      throw new Error( 'Datastore not instantiated!' );
    }

    return new Promise( ( resolve, reject ) => {
      this.nedbinstance.find( query, ( err: any, res: any ) => {
        if( err ) {
          reject( err );
        }

        resolve( res );
      });
    });
  }

  public findOne( query = {} ): Promise<DatabaseRecord> {
    if( !this.nedbinstance ) {
      throw new Error( 'Datastore not instantiated!' );
    }

    return new Promise( ( resolve, reject ) => {
      this.nedbinstance.findOne( query, ( err: any, res: any ) => {
        if( err ) {
          reject( err );
        }

        resolve( res );
      });
    });
  }

  public insert( doc: any ): Promise<DatabaseRecord> {
    return new Promise( ( resolve, reject ) => {
      this.nedbinstance.insert( doc, ( err: any, newDoc: any ) => {
        if( err ) {
          reject( err );
        }

        resolve( newDoc );
      });
    });
  }

  public update( q: any, doc: any ): Promise<number> {
    return new Promise( ( resolve, reject ) => {
      this.nedbinstance.update( q, doc, {}, ( err: any, numreplaced: number ) => {
        if( err ) {
          reject( err );
        }

        resolve( numreplaced );
      });
    });
  }
}
