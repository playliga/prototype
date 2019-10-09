/**
 * Weird bug with eslint not resolving webpack aliases correctly so the resolve
 * config must be placed in a separate file and referenced directly in the .eslintrc
 * file.
 *
 * Also note that we must use CommonJS and not the import syntax.
 */
const path = require( 'path' );

module.exports = {
  extensions: [ '.ts', '.tsx', '.js', '.json' ],
  alias: {
    main: path.resolve( __dirname, '../main-process' ),
    renderer: path.resolve( __dirname, '../renderer-process' )
  },
  modules: [
    path.resolve( __dirname, '../node_modules' )
  ]
};
