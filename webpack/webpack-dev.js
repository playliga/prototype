import path from 'path';
import webpack from 'webpack';
import webpackConfig from './webpack-shared.js';

const PORT = process.env.PORT || 3000;

export default {
  resolve: webpackConfig.resolve,
  entry: [
    `webpack-hot-middleware/client?reload=true&path=http://localhost:${PORT}/__webpack_hmr`,
    path.join( __dirname, '../src/index' )
  ],
  output: {
    path: path.join( __dirname, '../dist' ),
    publicPath: `http://localhost:${PORT}/dist/`,
    filename: 'bundle.js'
  },
  module: {
    preLoaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: "eslint"
    }],
    loaders: [
      webpackConfig.loaders.js
    ]
  },
  eslint: {
    emitWarning: true
  },
  plugins: [
    // https://webpack.github.io/docs/hot-module-replacement-with-webpack.html
    new webpack.HotModuleReplacementPlugin(),

    // If you are using the CLI, the webpack process will not exit with an
    // error code by enabling this plugin:
    // https://github.com/webpack/docs/wiki/list-of-plugins#noerrorsplugin
    new webpack.NoErrorsPlugin()
  ],

  // needed to set all of electron built-in modules as externals plus some
  // other bits here and there
  target: 'electron-renderer'
};
