/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import { spawn } from 'child_process';
import config from './webpack-dev';

const PORT = process.env.PORT || 3000;

const app = express();
const compiler = webpack( config );
const argv = require( 'minimist' )( process.argv.slice( 2 ) );

// inject the webpack middleware modules into the server
const wdm = webpackDevMiddleware( compiler, {
  quiet: false,
  publicPath: config.output.publicPath,
  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: true,
    assets: false,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: true,
    errorDetails: true,
    warnings: true
  }
});

app.use( wdm );
app.use( webpackHotMiddleware( compiler ) );

// start the server!
let childProcess;

const server = app.listen( PORT, 'localhost', ( err ) => {
  if( err ) {
    console.error( err );
    return;
  }

  // are we also starting electron?
  if( argv[ 'dev-electron' ] ) {
    childProcess = spawn( 'npm', [ 'run', 'start:dev-electron', argv[ 'dev-console' ] ? '-- --dev-console' : '' ], {
      shell: true,
      env: process.env,
      stdio: 'inherit'
    }).on( 'close', code => process.exit( code ) )
      .on( 'error', spawnError => console.error( spawnError ) );
  }

  console.log( `Listening at http://localhost:${PORT}` );
});

// we need to handle exiting the server since we're spawning a process above
// depending on the arguments passed
process.on( 'SIGTERM', () => {
  console.log( 'Stopping dev server' );

  childProcess.kill();
  wdm.close();
  server.close( () => process.exit( 0 ) );
});
