import path from 'path';

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
    path.resolve( __dirname, '../renderer-process' ),
    path.resolve( __dirname, '../node_modules' )
  ],
};
