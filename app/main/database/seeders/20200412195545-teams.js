const protiers = require( '../fixtures/20200720002337-protiers' );
const lowtiers = require( '../fixtures/20200525202850-lowtiers' );


const regionsmap = {
  1: 5,     // north america
  2: 4,     // europe
};


module.exports = {
  up: async ( queryInterface ) => {
    const [ countryrows ] = await queryInterface.sequelize.query(`
      SELECT id, code, continentId FROM Countries;
    `);

    const teams = [
      ...protiers,
      ...lowtiers
    ];

    const output = teams.map( team => {
      // get the country
      let country = countryrows.find( c => c.code.toLowerCase() === team.countrycode.toLowerCase() );

      // try to get this team's region by mapping the
      // scraperid to a known id in our database
      const teamregion = regionsmap[ team.region_id ];

      // if country is not within the team's specified region
      // default to one that's within that region
      if( country.continentId !== teamregion && !country ) {
        // get a country from this region
        country = countryrows.find( c => c.continentId === teamregion );
      }

      // build the record to insert
      return ({
        name: team.name,
        tag: team.tag,
        logo: team.logourl,
        tier: team.tier,
        countryId: country.id,
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
