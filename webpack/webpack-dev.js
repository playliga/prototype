import path from 'path';
import webpack from 'webpack';
import webpackConfig from './webpack-shared.js';

const PORT = process.env.PORT || 3000;

export default {
  resolve: webpackConfig.resolve,
  entry: [
    path.join( __dirname, '../renderer-process/index' )
  ],
  output: {
    path: path.join( __dirname, '../dist' ),
    publicPath: `http://localhost:${PORT}/dist/`,
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      webpackConfig.loaders.js,
      webpackConfig.loaders.eslint,
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { modules: true }
          }
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]___[hash:base64:5]'
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcss: {}
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.(png|jpg)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 100000
          }
        }]
      },
      {
        test: /\.(eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 100000
          }
        }]
      }
    ]
  },
  plugins: [
    // If you are using the CLI, the webpack process will not exit with an
    // error code by enabling this plugin:
    // https://github.com/webpack/docs/wiki/list-of-plugins#noerrorsplugin
    new webpack.NoEmitOnErrorsPlugin()
  ],

  // needed to set all of electron built-in modules as externals plus some
  // other bits here and there
  target: 'electron-renderer'
};
