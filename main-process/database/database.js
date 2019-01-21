// @flow
/* eslint-disable no-console, import/no-dynamic-require */
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { app } from 'electron';
import minimist from 'minimist';
import chalk from 'chalk';
import datastore from 'nedb';
import glob from 'glob';


// module-level variables and functions
const ARGS = minimist( process.argv.slice( 2 ) );
const POSARGS = ARGS._ || [];
const DBPATH = path.join( app.getPath( 'userData' ), 'databases' );
const SEEDERSPATH = path.join( __dirname, 'seeders' );

const database = {
  continents: new datastore( path.join( DBPATH, 'continents.db' ) ),
  countries: new datastore( path.join( DBPATH, 'countries.db' ) ),
  seeds: new datastore( path.join( DBPATH, 'seeds.db' ) )
};


/**
 * NeDB does not support async/await so these functions
 * are convenience wrappers around its APIs so that
 * they return promises instead of using callbacks
 *
 * @param ds The datastore object.
 */
function asyncLoadDatabase( ds: Object ): Promise<*> {
  return new Promise( ( resolve: Function, reject: Function ) => {
    ds.loadDatabase( ( err: Error ) => {
      if( err ) {
        reject( err );
      }

      resolve();
    });
  });
}


function asyncFind( ds: Object, query: Object ): Promise<*> {
  return new Promise( ( resolve: Function, reject: Function ) => {
    ds.find( query, ( err: Error, docs: any ) => {
      if( err ) {
        reject( err );
      }

      resolve( docs );
    });
  });
}


/**
 * Intended to be used via the CLI. Generates a seeder
 * file based off of the template file and saves it as
 * xxxxxxx-name.js
 *
 * Where xxxxxx is the unix timestamp.
 */
function generateSeeder() {
  // bail if we don't have a name
  if( !ARGS.name ) {
    throw new Error( 'Name is required as an argument' );
  }

  // create a file with the following format:
  // $unixtimestamp-$name.js
  const filename = `${Date.now()}-${ARGS.name.toString()}.js`;

  // create seeders directory if it
  // doesn't already exist
  if( !fs.existsSync( SEEDERSPATH ) ) {
    fs.mkdirSync( SEEDERSPATH );
  }

  // create the file
  fs.copyFileSync(
    path.join( SEEDERSPATH, 'seeder.js.template' ),
    path.join( SEEDERSPATH, filename )
  );
  console.log(
    chalk.blue( `${filename} was created in ${SEEDERSPATH}` )
  );
}


/**
 * Coming soon...
 */
async function loadSeeds(): Promise<*> {
  const { seeds } = database;
  const oldseeds = await asyncFind( seeds, {});
  const seedfiles = await promisify( glob )(
    '**/*.js',
    { cwd: SEEDERSPATH }
  );

  let newseeds = [];

  // if no seeds have been run then we
  // run all of the seedfiles
  if( oldseeds.length === 0 ) {
    newseeds = seedfiles;
  }

  // filter out seedfiles that have already been run
  oldseeds.forEach( ( seedobj: Object ) => {
    const found = seedfiles.indexOf( seedobj.filename ) >= 0;

    if( !found ) {
      newseeds.push( seedobj.filename );
    }
  });

  newseeds.forEach( ( filename: string ) => {
    // $FlowSkip
    const seeder = require(
      `${path.join( SEEDERSPATH, filename )}`
    ).default;

    seeder.up().then( ( stuff: any ) => {
      // after the seeder completes we must add its
      // filename to our list of executed seeders
      // seeds.insert({ filename });
      console.log( stuff );
    });
  });

  return Promise.resolve();
}


/**
 * Initializes the application database by looping
 * through the database object and loading all of
 * the datastores. Returns a promise once this is
 * completed.
 *
 * @param resolve Called once all databased are loaded
 * @param reject Called if any databased could not be loaded
 */
function init( resolve: Function, reject: Function ): void {
  const promises = Object.keys( database )
    .map( ( id: string ) => database[ id ] )
    .map( ( ds: Object ) => asyncLoadDatabase( ds ) );

  Promise.all( promises )
    .then( () => resolve( database ) )
    .catch( ( err: Error ) => reject( err ) );
}


/**
 * Exposes a CLI for administrative tasks such as generating
 * and running seeds.
 *
 * Handles what command is going to be executed by parsing
 * the positional arguments passed into the script.
 */
if( POSARGS.length > 0 ) {
  switch( POSARGS[ 0 ] ) {
    case 'generate':
      generateSeeder();
      break;
    case 'all':
      loadSeeds();
      break;
    default:
      // do nothing...
  }
}


export default class Database {
  static connect(): Promise<any> {
    return new Promise( init );
  }

  static getClient() {
    if( !database ) {
      throw Error( 'Database not connected!' );
    }

    return database;
  }
}