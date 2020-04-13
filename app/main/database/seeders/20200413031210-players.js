const teams = require( '../fixtures/202004120524-squads' );


module.exports = {
  up: async ( queryInterface ) => {
    // load data from db
    const [ countryrows ] = await queryInterface.sequelize.query(`
      SELECT id, code FROM Countries;
    `);
    const [ teamrows ] = await queryInterface.sequelize.query(`
      SELECT id, name FROM Teams;
    `);

    // this will store out player array
    const output = [];

    // parse each team's roster
    teams.forEach( team => {
      // find the teamid
      const { id: teamid } = teamrows.find( t => t.name === team.name );

      team.players.forEach( player => {
        // find the countryid
        const countrycode = player.countrycode.toLowerCase() || 'na';
        const { id: countryid } = countryrows.find( c => c.code.toLowerCase() === countrycode );

        // add to the output
        output.push({
          alias: player.alias,
          tier: team.tier,
          teamId: teamid,
          countryId: countryid,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    });

    return queryInterface.bulkInsert( 'Players', output, { ignoreDuplicates: true });
  },

  down: () => {
    // @todo
  }
};
