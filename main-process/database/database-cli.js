// @flow
/* eslint-disable no-console */
/* eslint-disable import/no-dynamic-require */
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import minimist from 'minimist';
import chalk from 'chalk';
import glob from 'glob';
import Database from './database';


// module-level variables and functions
const ARGS = minimist( process.argv.slice( 2 ) );
const POSARGS = ARGS._ || [];
const ROOTPATH = path.join( __dirname, '../../' );
const DBPATH = path.join( ROOTPATH, 'resources/databases' );
const SEEDERSPATH = path.join( ROOTPATH, 'resources/seeders' );


/**
 * Intended to be used via the CLI. Generates a seeder
 * file based off of the template file and saves it as
 * xxxxxxx-name.js
 *
 * Where xxxxxx is the unix timestamp.
**/
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
    path.join( __dirname, 'seeder.js.template' ),
    path.join( SEEDERSPATH, filename )
  );
  console.log(
    chalk.blue( `${filename} was created in ${SEEDERSPATH}` )
  );
}


/**
 * Coming soon...
**/
async function loadAllSeeds( dbinstance: Object ): Promise<*> {
  const { seeds } = dbinstance.datastores;
  const seederfilenames = await promisify( glob )(
    '**/*.js',
    { cwd: SEEDERSPATH }
  );

  // load all the seeds that were executed
  const allseeds = await seeds.find();
  let pendingseeds = [];

  // if no needs have been previously executed
  // we're going to run them all
  if( allseeds.length === 0 ) {
    pendingseeds = seederfilenames;
  }

  // otherwise filter seeds by those that have not been
  // run. the allseeds array stores past executed seeds
  pendingseeds = seederfilenames.filter( ( filename: string ) => {
    const found = allseeds.findIndex( ( seedobj: Object ) => (
      seedobj.filename === filename
    ) );

    // we only want those that were *not* found
    return found === -1;
  });

  const promises = pendingseeds.map( ( filename: string ) => {
    // $FlowSkip
    const seeder = require(
      `${path.join( SEEDERSPATH, filename )}`
    ).default;

    return seeder.up( dbinstance.datastores, Database ).then( () => (
      // after the seeder completes we must add its
      // filename to our list of executed seeders
      seeds.insert({ filename })
    ) );
  });

  return Promise.all( promises );
}


/**
 * Exposes a CLI for administrative tasks such as generating
 * and running seeds.
 *
 * Handles what command is going to be executed by parsing
 * the positional arguments passed into the script.
**/
if( POSARGS.length > 0 ) {
  const dbinstance = new Database( DBPATH );

  switch( POSARGS[ 0 ] ) {
    case 'generate':
      generateSeeder();
      break;
    case 'all':
      dbinstance.connect().then( () => {
        loadAllSeeds( dbinstance );
      });
      break;
    default:
      // do nothing...
  }
}