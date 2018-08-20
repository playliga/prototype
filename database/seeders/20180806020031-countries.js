const countries = require( '../seeders-data/countries.json' );

const formatted = [];

Object.keys( countries ).forEach( ( continentLabel ) => {
  const continent = countries[ continentLabel ];

  Object.keys( continent.countries ).forEach( ( countryCode ) => {
    const country = continent.countries[ countryCode ];
    formatted.push({
      name: country,
      code: countryCode,
      continentId: continent.id
    });
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
