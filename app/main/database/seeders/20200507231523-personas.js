const faker = require( 'faker' );
const { flatten, random } = require( 'lodash');


/**
 * Supported faker lib locale
 *
 * See: https://github.com/Marak/faker.js#localization
 */

const fakerlocale = [
  'az',
  'cz',
  'de',
  'es',
  'fr',
  'ge',
  'it',
  'nl',
  'pl',
  'ru',
  'sk',
  'sv',
  'tr',
  'vi',
];


function genPersona( typeId, teamId, countryId ) {
  return ({
    fname: faker.name.firstName(),
    lname: faker.name.lastName(),
    personaTypeId: typeId,
    teamId: teamId,
    countryId: countryId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}


function genTeamData( team, personatypes ) {
  // parse the locale from the country code,
  // default to `en` if nothing is found
  const locale = fakerlocale.find( i => i === team.countryCode.toLowerCase() );

  if( locale ) {
    faker.locale = locale;
  } else {
    faker.locale = 'en';
  }

  // get the persona types we need
  const manager = personatypes.find( p => p.name === 'Manager' );
  const astmanager = personatypes.find( p => p.name === 'Assistant Manager' );

  return [
    genPersona( manager.id, team.teamId, team.countryId ),
    genPersona( astmanager.id, team.teamId, team.countryId )
  ];
}


function genPlayerData( personatypes, countries ) {
  // get a random locale
  const randidx = random( 0, fakerlocale.length - 1 );
  const locale = fakerlocale[ randidx ];
  faker.locale = locale;

  // get the countryId
  const { id } = countries.find( c => c.code.toLowerCase() === locale );

  // get the persona types we need
  const manager = personatypes.find( p => p.name === 'Manager' );
  const astmanager = personatypes.find( p => p.name === 'Assistant Manager' );

  return [
    genPersona( manager.id, null, id ),
    genPersona( astmanager.id, null, id )
  ];
}


module.exports = {
  up: async ( queryInterface ) => {
    // get all persona types
    const [ personatypes ] = await queryInterface.sequelize.query(`
      SELECT * FROM PersonaTypes;
    `);

    // get all countries
    const [ countries ] = await queryInterface.sequelize.query(`
      SELECT * FROM Countries;
    `);

    // get all teams and their regions
    const [ teams ] = await queryInterface.sequelize.query(`
      SELECT
        Teams.id AS teamId,
        Countries.id AS countryId,
        Countries.code AS countryCode,
        Continents.id AS continentId,
        Continents.code AS continentCode
      FROM Teams
      LEFT JOIN Countries
        ON Teams.countryId = Countries.id
      LEFT JOIN Continents
        ON Countries.continentId = Continents.id;
    `);

    // generate the team's persona data
    const teamdata = teams.map( t => genTeamData( t, personatypes ) );

    // generate 10 random personas to be randomly
    // assigned to the player after they register
    const playerdata = Array( 10 )
      .fill( null )
      .map( () => genPlayerData( personatypes, countries ) )
    ;

    // save to the db
    return queryInterface.bulkInsert( 'Personas', [
      ...flatten( teamdata ),
      ...flatten( playerdata )
    ]);
  },

  down: () => {
    // @todo
  }
};
