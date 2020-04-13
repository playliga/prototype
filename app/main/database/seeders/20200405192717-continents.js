const { continents } = require( 'countries-list' );


function continentformatter( code ) {
  return {
    code: code,
    name: continents[ code ],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}


module.exports = {
  up: async ( queryInterface ) => {
    const continentdata = Object.keys( continents ).map( continentformatter );
    return queryInterface.bulkInsert( 'Continents', continentdata, { ignoreDuplicates: true });
  },

  down: ( queryInterface, Sequelize ) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  }
};
