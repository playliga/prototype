const { flatten } = require( 'lodash' );
const { countries } = require( 'countries-list' );


function countryformatter( continentobj ) {
  return Object.keys( countries )
    .filter( code => countries[ code ].continent === continentobj.code )
    .map( code => ({
      name: countries[ code ].name,
      code: code,
      continentId: continentobj.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  ;
}


module.exports = {
  up: async ( queryInterface ) => {
    // get the continent ids from the db
    const [ continentrows ] = await queryInterface.sequelize.query(`
      SELECT id, code FROM 'continents';
    `);

    // and finally, save the country data with the continent ids
    const countrydata = flatten( continentrows.map( countryformatter ) );
    return queryInterface.bulkInsert( 'Countries', countrydata, { ignoreDuplicates: true });
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
