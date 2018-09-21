module.exports = {
  up: ( queryInterface, Sequelize ) => (
    queryInterface.bulkInsert( 'divisions', [
      { name: 'Invite' },
      { name: 'Premier' },
      { name: 'Main' },
      { name: 'Intermediate' },
      { name: 'Open' }
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
