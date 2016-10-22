var path = require( 'path' );
var webpack = require( 'webpack' );
var webpackTargetElectronRenderer = require( 'webpack-target-electron-renderer' );
var webpackConfig = require( path.join( __dirname, './webpack-shared.js' ) );

var config = {
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
    new webpack.HotModuleReplacementPlugin()
  ]
};

// The webpack-target-electron-renderer is needed to set all of electron
// built-in modules as externals plus some other bits here and there
config.target = webpackTargetElectronRenderer( config );

module.exports = config;
