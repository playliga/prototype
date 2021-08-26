const protiers = require( '../fixtures/20200720002337-protiers' );
const lowtiers = require( '../fixtures/20200726180450-lowtiers' );
const compdefs = require( '../fixtures/compdefs.json' );


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

    // keep track of our total team
    // count to limit things later
    const esea = compdefs.find( c => c.id === 'esea' );
    const total_teams = {};

    // @note: some teams get trimmed along the way, either
    //        because of dupe names or some other reason. still
    //        unknown why, so this acts as a buffer so that
    //        we have the required amount of teams when
    //        generating the leagues later on
    const MAX_TEAMS_BUFFER = 10;

    const output = teams.map( team => {
      // try to get this team's region by mapping the
      // scraperid to a known id in our database
      const teamregion = regionsmap[ team.region_id ];

      // skip this team if we have reached the
      // team limit for this region and tier.
      if( total_teams[ teamregion ] ) {
        if( total_teams[ teamregion ][ team.tier ] >= esea.tiers[ team.tier ].minlen + MAX_TEAMS_BUFFER ) {
          return;
        }
      } else {
        total_teams[ teamregion ] = {};
      }

      // get the country
      let country = countryrows.find( c => c.code.toLowerCase() === team.countrycode.toLowerCase() );

      // if country is not within the team's specified region
      // default to one that's within that region
      if( country.continentId !== teamregion && !country ) {
        // get a country from this region
        country = countryrows.find( c => c.continentId === teamregion );
      }

      // add to our region+tier team tally
      total_teams[ teamregion ][ team.tier ] = ( total_teams[ teamregion ][ team.tier ] || 0 ) + 1;

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

    return queryInterface.bulkInsert(
      'Teams',
      output.filter( t => t !== undefined ),
      { ignoreDuplicates: true }
    );
  },

  down: () => {
    // @todo
  }
};
