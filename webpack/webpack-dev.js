import path from 'path';
import webpack from 'webpack';
import webpackConfigShared from './webpack-shared.js';
import webpackConfigResolve from './webpack-resolve.js';

const PORT = process.env.PORT || 3000;

export default {
  mode: 'development',
  resolve: webpackConfigResolve,
  entry: {
    splash: [
      'react-hot-loader/patch',
      `webpack-hot-middleware/client?reload=true&path=http://localhost:${PORT}/__webpack_hmr`,
      path.join( __dirname, '../renderer-process/splash-page/index' )
    ]
  },
  output: {
    filename: '[name].js',
    path: path.join( __dirname, '../dist' ),
    publicPath: `http://localhost:${PORT}/dist/`
  },
  module: {
    rules: [
      webpackConfigShared.loaders.js,
      webpackConfigShared.loaders.eslint,
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
    // https://webpack.github.io/docs/hot-module-replacement-with-webpack.html
    new webpack.HotModuleReplacementPlugin()
  ],

  // needed to set all of electron built-in modules as externals plus some
  // other bits here and there
  target: 'electron-renderer'
};
