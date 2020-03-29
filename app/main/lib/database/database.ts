import path from 'path';
import NeDB from 'nedb';
import { IterableObject } from 'main/types';


/**
 * Persist the NeDB instances within an iterable object
 * where each item is a datastore singleton instance.
 */
const _nedbinstances: IterableObject<any> = {};


/**
 * Persist the database instance as a singleton object.
 */
let _dbinstance: Database;



export class Datastore {
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
    return _nedbinstances[ this.name ];
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
  public connect() {
    if( this.nedbinstance ) {
      return Promise.resolve( this.nedbinstance );
    }

    // set the singleton object
    _nedbinstances[ this.name ] = new NeDB(
      this.fullpath
    );

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
   * Resyncs the database by running NeDB's `compactdatafile`
   * function. It promisify's it by completing the async
   * task once the `compaction.done` event is triggered.
   *
   * Under the hood NeDB uses an append-only format. Meaning
   * that all updates and deletes actually result in lines
   * added at the end of the datafile.
   *
   * https://github.com/louischatriot/nedb#persistence
   *
   * @return Promise
   */
  public resync() {
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

  public find( query = {}) {
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

  public insert( doc: any ) {
    return new Promise( ( resolve, reject ) => {
      this.nedbinstance.insert( doc, ( err: any, newDoc: any ) => {
        if( err ) {
          reject( err );
        }

        resolve( newDoc );
      });
    });
  }

  public update( q: any, doc: any ) {
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


export default class Database {
  public dbpath = '';
  public datastores: IterableObject<Datastore> = {};

  constructor( dbpath = '' ) {
    if( _dbinstance ) {
      return _dbinstance;
    }

    // if no instance is ready and path was not provided, bail
    if( !dbpath && _dbinstance ) {
      throw new Error(`
        Database is not instantiated and path was not provided!
      `);
    }

    this.dbpath = dbpath;
    this.datastores = {
      seeds: new Datastore( 'seeds', this.dbpath ),
      continents: new Datastore( 'continents', this.dbpath ),
      userdata: new Datastore( 'userdata', this.dbpath ),
      teams: new Datastore( 'teams', this.dbpath ),
      players: new Datastore( 'players', this.dbpath ),
      compdefs: new Datastore( 'compdefs', this.dbpath ),
      competitions: new Datastore( 'competitions', this.dbpath )
    };

    _dbinstance = this;
    return _dbinstance;
  }

  /**
   * Getter for returning an array of all of the datastore
   * paths. Mainly used by the app when cloning the
   * database on a fresh install.
  **/
  get datastorepaths() {
    return Object
      .keys( this.datastores )
      .map( ( dskey ) => this.datastores[ dskey ] )
      .map( ( ds ) => ds.fullpath );
  }

  /**
   * Loop through all the datastores and load them.
   * Returns a promise once all databastores have
   * been loaded.
  **/
  public connect() {
    const promises = Object.keys( this.datastores )
      .map( ( dskey ) => this.datastores[ dskey ] )
      .map( ( ds ) => ds.connect() );

    return Promise.all( promises );
  }
}
