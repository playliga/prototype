const teams = require( '../fixtures/202004120524-squads' );


module.exports = {
  up: async ( queryInterface ) => {
    const [ countryrows ] = await queryInterface.sequelize.query(`
      SELECT id, code FROM Countries;
    `);

    const output = teams.map( team => {
      // get the countryid
      const countrycode = team.countrycode.toLowerCase() || 'na';
      const { id: countryid } = countryrows.find( c => c.code.toLowerCase() === countrycode );

      // build the record to insert
      return ({
        name: team.name,
        tag: team.tag,
        logo: team.logourl,
        tier: team.tier,
        countryId: countryid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    return queryInterface.bulkInsert( 'Teams', output, { ignoreDuplicates: true });
  },

  down: () => {
    // @todo
  }
};
