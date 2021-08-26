const protiers = require( '../fixtures/20200720002337-protiers' );
const lowtiers = require( '../fixtures/20200726180450-lowtiers' );


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

    const teams = [
      ...protiers,
      ...lowtiers
    ];

    // parse each team's roster
    teams.forEach( team => {
      // find the teamid
      const teamresult = teamrows.find( t => t.name === team.name );

      // bail if this team in not in our db
      if( !teamresult ) {
        return;
      }

      team.players.forEach( player => {
        // find the countryid
        const countrycode = player.countrycode.toLowerCase() || 'na';
        const { id: countryid } = countryrows.find( c => c.code.toLowerCase() === countrycode );

        // add to the output
        output.push({
          alias: player.alias,
          tier: team.tier,
          teamId: teamresult.id,
          countryId: countryid,
          createdAt: new Date(),
          updatedAt: new Date(),
          eligibleDate: null,
          starter: false,
          stats: null,
          gains: null,
        });
      });
    });

    return queryInterface.bulkInsert( 'Players', output );
  },

  down: () => {
    // @todo
  }
};
