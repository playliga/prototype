import path from 'path';
import webpack from 'webpack';
import webpackConfig from './webpack-shared.js';

const PORT = process.env.PORT || 3000;
const ROOT = path.join( `${__dirname}/../` );

export default {
  resolve: webpackConfig.resolve,
  entry: [
    `webpack-hot-middleware/client?reload=true&path=http://localhost:${PORT}/__webpack_hmr`,
    './renderer-process/index'
  ],
  output: {
    path: path.join( ROOT, 'dist' ),
    publicPath: `http://localhost:${PORT}/dist/`,
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      webpackConfig.loaders.js,
      {
        test: /\.css$/,
        loaders: [
          'style',
          'css'
        ]
      },
      {
        test: /\.scss$/,
        loaders: [
          'style',
          'css?sourceMap&modules&localIdentName=[name]__[local]___[hash:base64:5]',
          'postcss',
          'sass'
        ]
      }
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
