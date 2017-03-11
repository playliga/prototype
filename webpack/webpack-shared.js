import path from 'path';

const ROOT = path.join( `${__dirname}/../` );

exports.loaders = {
  js: {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    loader: 'babel'
  }
};

exports.resolve = {
  extensions: [ '', '.js', '.jsx' ],
  root: [
    path.resolve( ROOT, 'renderer-process' )
  ],
};
