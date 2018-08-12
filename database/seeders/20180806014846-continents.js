module.exports = {
  up: ( queryInterface, Sequelize ) => (
    queryInterface.bulkInsert( 'continents', [
      { code: 'EU', name: 'Europe' },
      { code: 'NA', name: 'North America' }
    ], {})
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
