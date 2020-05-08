

function genPersonaType( name ) {
  return ({
    name: name,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}


module.exports = {
  up: async ( queryInterface ) => {
    return queryInterface.bulkInsert( 'PersonaTypes', [
      genPersonaType( 'Manager' ),
      genPersonaType( 'Assistant Manager' ),
    ]);
  },

  down: () => {
    // @todo
  }
};
