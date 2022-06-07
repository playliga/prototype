const data = require( '../fixtures/compdefs.json' );


module.exports = {
  up: async ( queryInterface ) => {
    const [ comptypes ] = await queryInterface.sequelize.query(`
      SELECT id, name FROM Comptypes;
    `);

    // format the data to insert into the db
    const formattedrow = data.map( d => ({
      comptypeId: comptypes.find( type => d.type === type.name ).id,
      isOpen: d.isopen,
      meetTwice: d.meetTwice,
      name: d.name,
      season: d.season,
      seasonYear: d.seasonYear,
      startOffset: d.startoffset,
      tiers: d.tiers ? JSON.stringify( d.tiers ) : null,
      prizePool: d.prizePool ? JSON.stringify( d.prizePool ) : null,

      // timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    return queryInterface.bulkInsert( 'Compdefs', formattedrow, { ignoreDuplicates: true });
  },

  down: ( queryInterface, Sequelize ) => {
    // @todo
  }
};
