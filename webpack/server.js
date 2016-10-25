import path from 'path';
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from './webpack-dev.js';

const PORT = process.env.PORT || 3000;
const app = express();
const compiler = webpack( config );

// inject the webpack middleware modules into the server
app.use( webpackDevMiddleware( compiler, {
  noInfo    : true,
  publicPath: config.output.publicPath,
  stats     : 'errors-only'
}));

app.use( webpackHotMiddleware( compiler ) );

// start the server!
app.listen( PORT, 'localhost', err => {
  if( err ) {
    console.error( err );
    return;
  }

  console.log(`Listening at http://localhost:${PORT}`);
});
