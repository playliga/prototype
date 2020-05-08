module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'PersonaTypes', {
      // main fields
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: Sequelize.STRING,

      // timestamps
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'PersonaTypes' );
  }
};
