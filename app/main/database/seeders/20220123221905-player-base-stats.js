const { random } = require( 'lodash' );
const Tiers = require( '../../../shared/tiers.json' );
const ChancesTable = {
  skill: [ 1, 3, 0 ],
  aggression: [ 1, 3, 0 ],
  reactionTime: [ .02, .05, 2 ],
  attackDelay: [ .02, .05, 2 ],
};
const StatModifiers = {
  SUBTRACT: [ 'reactionTime', 'attackDelay' ],
};


module.exports = {
  up: async ( queryInterface ) => {
    // grab the data we need
    const [ players ] = await queryInterface.sequelize.query(`
      SELECT * FROM Players
    `);

    // start the training session
    const trainingsession = players.map( player => {
      const tier = Tiers[ player.tier ];
      const stats = { ...tier.templates[ tier.templates.length - 1 ].stats };

      Object.keys( stats ).forEach( stat => {
        const [ min, max, decimalPlaces ] = ChancesTable[ stat ];
        const xp = random( min, max, decimalPlaces > 0 );
        if( StatModifiers.SUBTRACT.includes( stat ) ) {
          stats[ stat ] -= xp;
        } else {
          stats[ stat ] += xp;
        }
        if( decimalPlaces > 0 ) {
          stats[ stat ] = parseFloat( stats[ stat ].toFixed( decimalPlaces ) );
        }
      });

      return queryInterface.sequelize.query(`
        UPDATE Players
        SET
          stats = '${JSON.stringify( stats )}',
          tier = ${player.tier}
        WHERE id = ${player.id}
      `);
    });

    return Promise.all( trainingsession );
  },

  down: () => {
    // @todo
  }
};
