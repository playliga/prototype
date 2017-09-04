import path from 'path';

const ROOT = path.join( `${__dirname}/../` );

exports.loaders = {
  js: {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    loader: 'babel-loader'
  },
  eslint: {
    test: /\.jsx?$/,
    enforce: 'pre',
    exclude: /node_modules/,
    loader: 'eslint-loader',
    options: {
      emitWarning: true
    }
  }
};

exports.resolve = {
  extensions: [ '.js', '.jsx' ],
  modules: [
    path.resolve( ROOT, 'renderer-process' ),
    path.resolve( ROOT, 'node_modules' )
  ],
};
