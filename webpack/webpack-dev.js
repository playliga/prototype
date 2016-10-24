import path from 'path';
import webpack from 'webpack';
import webpackTargetElectronRenderer from 'webpack-target-electron-renderer';
import webpackConfig from './webpack-shared.js';

let config = {
  resolve: webpackConfig.resolve,
  entry: [
    'webpack-hot-middleware/client?reload=true&path=http://localhost:9000/__webpack_hmr',
    path.join( __dirname, '../src/index' )
  ],
  output: {
    path: path.join( __dirname, '../dist' ),
    publicPath: 'http://localhost:9000/dist/',
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
  ]
};

// The webpack-target-electron-renderer is needed to set all of electron
// built-in modules as externals plus some other bits here and there
config.target = webpackTargetElectronRenderer( config );

export default config;
