

function genComptype( name ) {
  return ({
    name: name,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}


module.exports = {
  up: async ( queryInterface ) => {
    return queryInterface.bulkInsert( 'Comptypes', [
      genComptype( 'championsleague' ),
      genComptype( 'leaguecup' ),
      genComptype( 'league' ),
    ]);
  },

  down: () => {
    // @todo
  }
};
