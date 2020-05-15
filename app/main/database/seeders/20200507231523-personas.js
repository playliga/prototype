const faker = require( 'faker' );
const { flatten } = require( 'lodash');


/**
 * Supported faker lib locale
 *
 * See: https://github.com/Marak/faker.js#localization
 * Also: https://github.com/Marak/faker.js/tree/master/lib/locales
 */

const localemap = [
  { id: 'az', region: 'eu', },
  { id: 'cz', region: 'eu', },
  { id: 'de', region: 'eu', },
  { id: 'en', region: 'na', altname: 'us' },
  { id: 'en_AU', region: 'oc', altname: 'au' },
  { id: 'en_CA', region: 'an', altname: 'aq' },       // workaround for antartica
  { id: 'en_IND', region: 'as', altname: 'in' },
  { id: 'en_IE', region: 'af', altname: 'za' },       // issues with `en_ZA` (South Africa)
  { id: 'en_GB', region: 'eu', altname: 'gb' },
  { id: 'es', region: 'eu', },
  { id: 'es_MX', region: 'sa', altname: 'mx' },
  { id: 'fr', region: 'eu', },
  { id: 'ge', region: 'eu', },
  { id: 'it', region: 'eu', },
  { id: 'ja', region: 'as', altname: 'jp' },
  { id: 'ko', region: 'as', altname: 'kr' },
  { id: 'nl', region: 'eu', },
  { id: 'pl', region: 'eu', },
  { id: 'pt_BR', region: 'sa', altname: 'br' },
  { id: 'ru', region: 'eu', },
  { id: 'sk', region: 'eu', },
  { id: 'sv', region: 'eu', altname: 'se' },
  { id: 'tr', region: 'eu', },
  { id: 'uk', region: 'eu', altname: 'ua' },
  { id: 'vi', region: 'as', altname: 'vn' },
];


function mapLocale( item, team ) {
  const { countryCode, continentCode } = team;

  // is there a direct match?
  let found = item.id === countryCode.toLowerCase();

  // what about altname? e.g.: uk -> gb
  if( !found && item.altname ) {
    found = item.altname === countryCode.toLowerCase();
  }

  // can we match the region?
  if( !found ) {
    found = item.region === continentCode.toLowerCase();
  }

  return found;
}


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


function assignPersonas( team, personatypes ) {
  // try to map the closest possible faker
  // locale to the team's location
  const locale = localemap.find( i => mapLocale( i, team ) );

  // if nothing — default to en
  if( locale ) {
    faker.locale = locale.id;
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


function getRandomPersonas( locale, personatypes, continents, countries ) {
  faker.locale = locale.id;

  // get the countryid for the provided locale
  // if altname is specified, use that instead
  const { id } = countries.find( c => c.code.toLowerCase() === ( locale.altname || locale.id ) );

  // get the persona types we need
  const manager = personatypes.find( p => p.name === 'Manager' );
  const astmanager = personatypes.find( p => p.name === 'Assistant Manager' );

  return [
    ...Array( 5 ).fill( null ).map( () => genPersona( manager.id, null, id ) ),
    ...Array( 5 ).fill( null ).map( () => genPersona( astmanager.id, null, id ) )
  ];
}


module.exports = {
  up: async ( queryInterface ) => {
    // get all persona types
    const [ personatypes ] = await queryInterface.sequelize.query(`
      SELECT * FROM PersonaTypes;
    `);

    // get all continents
    const [ continents ] = await queryInterface.sequelize.query(`
      SELECT * FROM Continents;
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
    const teamdata = teams.map( t => assignPersonas( t, personatypes ) );

    // generate free-agent personas per region
    // to later assign to the user's team
    const playerdata = localemap.map( locale => getRandomPersonas(
      locale,
      personatypes,
      continents,
      countries
    ) );

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
