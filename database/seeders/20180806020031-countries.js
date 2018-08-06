const countries = require( '../seeders-data/countries.json' );

module.exports = {
  up: ( queryInterface, Sequelize ) => (
    queryInterface.bulkInsert( 'countries', countries, {})
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
