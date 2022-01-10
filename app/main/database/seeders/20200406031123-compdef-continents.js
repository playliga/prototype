const data = require( '../fixtures/compdefs.json' );


/**
 * Handles the association of the competition definitions
 * and their region(s)/continents.
 */
function associatedata( compdefs, continents ) {
  const output = [];

  compdefs.forEach( comp => {
    // find the regions for the current compdef
    const { regions } = data.find( d => d.name === comp.name );

    if( !regions ) {
      // if no regions, then this will be an
      // international tourney; so bail out
      return;
    }

    // add the compdef to each region found
    regions.forEach( region => {
      // find the region's (continent) id
      const continent = continents.find( c => c.code.toLowerCase() === region.toLowerCase() );

      // add it to the associated data array
      output.push({
        compdefId: comp.id,
        continentId: continent.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  });

  return output;
}


module.exports = {
  up: async ( queryInterface ) => {
    // get the existing compdefs and continents list
    const [ comprows ] = await queryInterface.sequelize.query(`
      SELECT id, name FROM Compdefs;
    `);

    const [ continentrows ] = await queryInterface.sequelize.query(`
      SELECT id, code FROM Continents;
    `);

    // associate the data with the regions
    const assocdata = associatedata( comprows, continentrows );
    return queryInterface.bulkInsert( 'CompdefContinents', assocdata, { ignoreDuplicates: true });
  },

  down: ( queryInterface, Sequelize ) => {
    // @todo
  }
};
