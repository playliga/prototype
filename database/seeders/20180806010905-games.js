module.exports = {
  up: ( queryInterface, Sequelize ) => (
    queryInterface.bulkInsert( 'games', [
      { name: 'Counter-Strike 1.6', shortname: 'cstrike' },
      { name: 'Counter-Strike Global Offensive', shortname: 'csgo' }
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
