const { continents } = require( 'countries-list' );

const formatted = [];
Object.keys( continents ).forEach( ( continentCode ) => {
  formatted.push({
    code: continentCode,
    name: continents[ continentCode ]
  });
});

module.exports = {
  up: ( queryInterface, Sequelize ) => (
    queryInterface.bulkInsert( 'continents', formatted, {})
  ),

  down: ( queryInterface, Sequelize ) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
  }
};
