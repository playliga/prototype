/*
* Based off of boilerplate:
* https://github.com/chentsulin/electron-react-boilerplate
*/
import path from 'path';
import webpack from 'webpack';
import webpackexternals from 'webpack-node-externals';
import webpackConfigShared from './webpack-shared.js';
import webpackConfigResolve from './webpack-resolve.js';


const IS_PROD = process.env.NODE_ENV === 'production';


export default {
  mode: IS_PROD ? 'production' : 'development',
  resolve: webpackConfigResolve,
  entry: [
    path.join( __dirname, '../main' )
  ],
  output: {
    path: path.join( __dirname, '../' ),
    filename: 'main.bundle.js'
  },
  module: {
    rules: [
      webpackConfigShared.loaders.js,
      webpackConfigShared.loaders.eslint,
      webpackConfigShared.loaders.images
    ]
  },
  plugins: [
    // @TODO
  ],
  externals: [
    webpackexternals()
  ],

  // Set target to Electron specific node.js env
  // https://github.com/chentsulin/webpack-target-electron-renderer#how-this-module-works
  target: 'electron-main',

  // Disables webpack processing of __dirname and __filename.
  // If you run the bundle in node.js it falls back to these values of node.js
  // https://github.com/webpack/webpack/issues/2010
  node: {
    __dirname: false,
    __filename: false
  }
};
