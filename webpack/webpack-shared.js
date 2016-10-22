var path = require( 'path' );

exports.loaders = {
  js: {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    loader: 'babel'
  }
};

exports.resolve = {
  extensions: [ '', '.js', '.jsx' ]
};
