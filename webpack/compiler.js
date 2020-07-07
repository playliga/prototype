/* eslint-disable no-console */
import path from 'path';
import express from 'express';
import minimist from 'minimist';
import chalk from 'chalk';
import log from 'electron-log';
import { build, createTargets, Platform } from 'electron-builder';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import { spawn } from 'child_process';

import sharedconfig from './webpack-shared';
import rendererconfig from './webpack-renderer';
import electronconfig from './webpack-electron';


const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const ARGS = minimist( process.argv.slice( 2 ) );
const MSGPREFIX = chalk.blue( IS_PROD ? '[PROD]' : '[DEV]' );

let wdm;
let childProcess;
let server;


// format logging
log.transports.console.level = 'info';
log.transports.console.format = msg => `${MSGPREFIX} ${msg.data}`;
log.transports.file.level = 'debug';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
log.transports.file.resolvePath = () => path.join( __dirname, '/compiler.log' );


function handleErrors( err, stats ) {
  // bail on any fatal errors
  if( err ) {
    log.error( err.stack || err );

    if( err.details ) {
      log.error( err.details );
    }

    process.exit( 1 );
  }

  // format the compiler stats object for easier parsing
  // and bail if webpack returned any errors
  const info = stats.toJson( sharedconfig.compilerConfig );

  if( stats.hasErrors() ) {
    log.error( info.errors );
    process.exit( 1 );
  }

  if( stats.hasWarnings() ) {
    log.info( info.warnings );
  }

  // we're done! print out compiler logs
  log.debug( info );
}

function launchElectron( err ) {
  if( err ) {
    log.error( err );
    process.exit( 1 );
  }

  log.info( 'Running application...' );

  childProcess = spawn(
    'npm',
    [
      'run',
      'start:electron',
      ARGS[ 'dev-console' ] ? '-- --dev-console' : '',
      '--silent'
    ], {
      shell: true,
      env: process.env,
      stdio: 'inherit'
    }
  ) .on( 'close', code => process.exit( code ) )
    .on( 'error', spawnError => console.error( spawnError ) );
}

/**
 * Promisifies the `webpack.run()` function so that
 * builds that rely on other builds can run in sequential
 * order.
 *
 * @param {*} config Webpack config to compile
 */
function compile( config ) {
  return new Promise( ( resolve ) => {
    webpack( config ).run( ( err, stats ) => {
      handleErrors( err, stats );
      return resolve( stats );
    });
  });
}

/**
 * We need to handle exiting the server since we're spawning a
 * process depending on the arguments passed
 */
function handleClose() {
  log.info( 'Stopping server...' );
  childProcess.kill();
  wdm.close();
  server.close( () => process.exit( 0 ) );
}

function handleProd() {
  // figure out what platforms we'll be compiling
  const platforms = [];

  if( ARGS.mac ) {
    platforms.push( Platform.MAC );
  }

  if( ARGS.win ) {
    platforms.push( Platform.WINDOWS );
  }

  log.info( 'Compiling electron...' );
  compile( electronconfig )
    .then( () => {
      log.info( 'Compiling renderer...' );
      return compile( rendererconfig );
    })
    .then( () => {
      log.info( 'Building application...' );
      return build({
        targets: createTargets( platforms ),
        publish: ARGS.publish
      });
    })
    .then( ( output ) => {
      log.info( output );
    })
    .catch( ( err ) => {
      log.error( err );
    });
}

function handleDev() {
  log.info( 'Compiling electron...' );
  compile( electronconfig )
    .then( () => {
      log.info( 'Compiling renderer...' );

      const app = express();
      const compiler = webpack( rendererconfig );

      wdm = webpackDevMiddleware( compiler, {
        quiet: false,
        logLevel: 'warn',
        publicPath: rendererconfig.output.publicPath,
        stats: sharedconfig.compilerConfig
      });
      wdm.waitUntilValid( () => {
        server = app.listen( PORT, 'localhost', launchElectron );
      });

      app.use( wdm );
      app.use( webpackHotMiddleware( compiler ) );
    });
}


if( IS_PROD ) {
  handleProd();
} else {
  handleDev();
}

process.on( 'SIGINT', () => handleClose );
process.on( 'SIGTERM', () => handleClose );
