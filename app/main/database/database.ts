import fs from 'fs';
import { app } from 'electron';
import { IterableObject } from 'main/types';
import { DatabaseConfig } from './types';
import Datastore from './datastore';
import dbconfig from './config.json';


// vars to be persisted across module calls
let _dbpath: string;
let _datastores: IterableObject<Datastore>;


export default class Database {
  /**
   * Sets up the database by initializing any vars that should be
   * persisted and creating any paths that must exist.
   *
   * Lastly, this function will loop through the connections that
   * are defined in the config and loads them as Datastores.
   *
   * @return Promise
  **/
  public static connect( config: DatabaseConfig = dbconfig ) {
    // immediately resolve if we have already connected
    if( _dbpath && _datastores ) {
      return Promise.resolve([]);
    }

    // otherwise init the datastores object and load the path
    _datastores = {};
    _dbpath = Database.loadpath( config.basepath );

    if( !fs.existsSync( _dbpath ) ) {
      fs.mkdirSync( _dbpath );
    }

    // register the connections
    config.connections.forEach( c => {
      _datastores[ c ] = new Datastore( c, _dbpath );
    });

    const promises = Object.keys( _datastores )
      .map( ( dskey ) => _datastores[ dskey ] )
      .map( ( ds ) => ds.connect() );

    return Promise.all( promises );
  }

  /**
   * Loads the database path from the provided basepath.
   * String variables are supported which can
   * get the path from `app.getPath`:
   *
   * - %appData%/resources/database
   *
   * The string within the `%` will be parsed out and
   * passed into the `app.getPath` function.
   */
  private static loadpath( basepath: string ) {
    let parsedpath = basepath;

    // look to see if a string var was provided
    const re = /%(.+)%/;
    const found = basepath.match( re );

    if( found && found[ 1 ] ) {
      parsedpath = basepath.replace( re, app.getPath( found[ 1 ] ));
    }

    return parsedpath;
  }

  /**
   * Getters for the persisted module-level variables.
  **/
  static get datastorepaths() {
    return Object
      .keys( _datastores )
      .map( ( dskey ) => _datastores[ dskey ] )
      .map( ( ds ) => ds.fullpath );
  }

  static get datastores() {
    return _datastores;
  }
}
