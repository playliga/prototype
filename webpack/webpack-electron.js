/*
* Based off of boilerplate:
* https://github.com/chentsulin/electron-react-boilerplate
*/
import path from 'path';
import webpack from 'webpack';
import webpackConfig from './webpack-shared.js';

export default {
  devtool: 'source-map',
  resolve: webpackConfig.resolve,
  entry: [
    path.join( __dirname, '../main' )
  ],
  output: {
    path: path.join( __dirname, '../dist' ),
    filename: 'main.bundle.js'
  },
  module: {
    rules: [
      webpackConfig.loaders.js,
      webpackConfig.loaders.eslint
    ]
  }
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true
    })
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
