const { uniq } = require( 'lodash' );
const comps = require( '../fixtures/compdefs.json' );


function genComptype( name ) {
  return ({
    name: name,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}


module.exports = {
  up: async ( queryInterface ) => {
    // get the types of each competition defined
    const comptypes = uniq( comps.map( d => d.type ) );

    // save the data
    return queryInterface.bulkInsert(
      'Comptypes',
      comptypes.map( genComptype )
    );
  },

  down: () => {
    // @todo
  }
};
