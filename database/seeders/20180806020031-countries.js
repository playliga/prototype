const { continents, countries } = require( 'countries-list' );

const formatted = [];
const continentIdMap = {};

Object.keys( continents ).forEach( ( code, index ) => {
  continentIdMap[ code ] = index + 1;
});

Object.keys( countries ).forEach( ( countryCode ) => {
  const country = countries[ countryCode ];

  formatted.push({
    name: country.name,
    code: countryCode,
    continentId: continentIdMap[ country.continent ]
  });
});

module.exports = {
  up: ( queryInterface, Sequelize ) => (
    queryInterface.bulkInsert( 'countries', formatted, {})
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
