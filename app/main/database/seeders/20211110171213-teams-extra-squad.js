const { shuffle } = require( 'lodash' );
const PERCENTAGE_FREEAGENTS = 40;


module.exports = {
  up: async ( queryInterface ) => {
    // grab the data we need
    const [ freeagents ] = await queryInterface.sequelize.query(`
      SELECT id, alias, countryId FROM Players WHERE teamId is NULL
    `);
    const [ teams ] = await queryInterface.sequelize.query(`
      SELECT id, countryId FROM Teams
    `);

    // create our selection pool of free agents for teams to pick from
    const selectionpoolnum = Math.floor( freeagents.length * ( PERCENTAGE_FREEAGENTS / 100 ) );
    const selectionpool = shuffle( freeagents )
      .slice( 0, selectionpoolnum )
      .map( ( player, idx ) => ({ id: player.id, teamId:  teams[ idx ]?.id || null }))
      .filter( player => !!player.teamId )
    ;

    // loop thru and update the records
    const updates = selectionpool.map( player => {
      return queryInterface.sequelize.query(`
        UPDATE Players
        SET
          teamId = "${player.teamId}",
          transferListed = true
        WHERE id = ${player.id}
      `);
    });
    return Promise.all( updates );
  },

  down: () => {
    // @todo
  }
};
