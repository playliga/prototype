// @flow
import path from 'path';
import NeDB from 'nedb';


/**
 * Persist this variable outside the scope of the database
 * class in order to support singleton behavior
 */
const _nedbinstances = {};


class Datastore {
  basepath: string;
  fullpath: string;
  name: string;

  constructor( basepath: string ) {
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

  connect(): Promise<any> {
    if( this.nedbinstance ) {
      return Promise.resolve( this.nedbinstance );
    }

    // set the singleton object
    _nedbinstances[ this.name ] = new NeDB(
      this.fullpath
    );

    return new Promise( ( resolve: Function, reject: Function ) => {
      this.nedbinstance.loadDatabase( ( err: Error ) => {
        if( err ) {
          reject( err );
        }

        resolve();
      });
    });
  }

  find( query: Object = {}): Promise<any> {
    if( !this.nedbinstance ) {
      throw new Error( 'Datastore not instantiated!' );
    }

    return new Promise( ( resolve: Function, reject: Function ) => {
      this.nedbinstance.find( query, ( err: Error, res: any ) => {
        if( err ) {
          reject( err );
        }

        resolve( res );
      });
    });
  }

  insert( doc: Object ): Promise<any> {
    return new Promise( ( resolve: Function, reject: Function ) => {
      this.nedbinstance.insert( doc, ( err: Error, newDoc: Object ) => {
        if( err ) {
          reject( err );
        }

        resolve( newDoc );
      });
    });
  }
}


class ContinentDatastore extends Datastore {
  name = 'continents';
}


class SeedDatastore extends Datastore {
  name = 'seeds';
}


export default class Database {
  dbpath: string;
  datastores: Object;

  constructor( dbpath: string ) {
    this.dbpath = dbpath;
    this.datastores = {
      seeds: new SeedDatastore( this.dbpath ),
      continents: new ContinentDatastore( this.dbpath )
    };
  }

  get datastorepaths(): Array<string> {
    return Object
      .keys( this.datastores )
      .map( ( dskey: string ) => this.datastores[ dskey ] )
      .map( ( ds: Datastore ) => ds.fullpath );
  }

  connect(): Promise<any> {
    const promises = Object.keys( this.datastores )
      .map( ( dskey: string ) => this.datastores[ dskey ] )
      .map( ( ds: Object ) => ds.connect() );

    return Promise.all( promises );
  }
}