import path from 'path';
import NeDB from 'nedb';


/**
 * Persist this variable outside the scope of the database
 * class. Each property should be a singleton Datastore
 * instance.
**/
const _nedbinstances = {};


export class Datastore {
  basepath;
  name;

  constructor( name, basepath = '' ) {
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
  connect() {
    if( this.nedbinstance ) {
      return Promise.resolve( this.nedbinstance );
    }

    // set the singleton object
    _nedbinstances[ this.name ] = new NeDB(
      this.fullpath
    );

    return new Promise( ( resolve, reject ) => {
      this.nedbinstance.loadDatabase( ( err ) => {
        if( err ) {
          reject( err );
        }

        resolve();
      });
    });
  }

  find( query = {}) {
    if( !this.nedbinstance ) {
      throw new Error( 'Datastore not instantiated!' );
    }

    return new Promise( ( resolve, reject ) => {
      this.nedbinstance.find( query, ( err, res ) => {
        if( err ) {
          reject( err );
        }

        resolve( res );
      });
    });
  }

  insert( doc ) {
    return new Promise( ( resolve, reject ) => {
      this.nedbinstance.insert( doc, ( err, newDoc ) => {
        if( err ) {
          reject( err );
        }

        resolve( newDoc );
      });
    });
  }
}


export default class Database {
  dbpath;
  datastores;

  constructor( dbpath ) {
    this.dbpath = dbpath;
    this.datastores = {
      seeds: new Datastore( 'seeds', this.dbpath ),
      continents: new Datastore( 'continents', this.dbpath )
    };
  }

  /**
   * Getter for returning an array of all of the datastore
   * paths. Mainly used by the app hen cloning the
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
  connect() {
    const promises = Object.keys( this.datastores )
      .map( ( dskey ) => this.datastores[ dskey ] )
      .map( ( ds ) => ds.connect() );

    return Promise.all( promises );
  }
}
