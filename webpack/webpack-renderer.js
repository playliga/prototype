import path from 'path';
import webpack from 'webpack';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpackConfigShared from './webpack-shared.js';
import webpackConfigResolve from './webpack-resolve.js';


const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const ROOT = path.join( __dirname, '../' );
const ENTRIES = [ 'splash', 'firstrun', 'main' ];


const outputs = {
  PROD: {
    filename: '[name]/[name].js',
    path: path.join( ROOT, 'dist/renderer/windows' )
  },
  DEV: {
    filename: '[name].js',
    publicPath: `http://localhost:${PORT}/windows/`
  }
};


function devEntries() {
  const output = {};

  ENTRIES.forEach( ( item ) => {
    output[item] = [
      'react-hot-loader/patch',
      `webpack-hot-middleware/client?reload=true&path=http://localhost:${PORT}/__webpack_hmr`,
      path.join( ROOT, `app/renderer/windows/${item}/index` )
    ];
  });

  return output;
}

function genplugins() {
  const output = [];

  if( IS_PROD ) {
    output.push(
      new CleanWebpackPlugin([ 'dist' ], {
        root: ROOT
      })
    );
  } else {
    output.push( new webpack.HotModuleReplacementPlugin() );
  }

  ENTRIES.forEach( ( item ) => {
    output.push(
      new HtmlWebpackPlugin({
        filename: `${item}/index.html`,
        template: path.join( __dirname, 'index.template.html' ),
        chunks: [ item ]
      }),
    );
  });

  return output;
}

function prodEntries() {
  const output = {};

  ENTRIES.forEach( ( item ) => {
    output[item] = path.join( ROOT, `app/renderer/windows/${item}/index` );
  });

  return output;
}


export default {
  mode: IS_PROD ? 'production' : 'development',
  resolve: webpackConfigResolve,
  entry: IS_PROD ? prodEntries() : devEntries(),
  output: IS_PROD ? outputs.PROD : outputs.DEV,
  module: {
    rules: [
      webpackConfigShared.loaders.js,
      webpackConfigShared.loaders.eslint,
      webpackConfigShared.loaders.css,
      webpackConfigShared.loaders.scss,
      webpackConfigShared.loaders.images,
      webpackConfigShared.loaders.fonts
    ]
  },
  plugins: genplugins(),

  // needed to set all of electron built-in modules as externals plus some
  // other bits here and there
  target: 'electron-renderer'
};
