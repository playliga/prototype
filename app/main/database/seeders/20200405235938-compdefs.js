const data = require( '../fixtures/compdefs.json' );


module.exports = {
  up: ( queryInterface ) => {
    // format the data to insert into the db
    const formattedrow = data.map( d => ({
      name: d.name,
      season: d.season,
      tiers: JSON.stringify( d.tiers ),
      isOpen: d.isopen,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    return queryInterface.bulkInsert( 'Compdefs', formattedrow, { ignoreDuplicates: true });
  },

  down: ( queryInterface, Sequelize ) => {
    // @todo
  }
};
