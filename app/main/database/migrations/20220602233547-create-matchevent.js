module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'MatchEvents', {
      // main fields
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      payload: {
        type: Sequelize.JSON,
      },
      type: {
        type: Sequelize.STRING
      },

      // timestamps
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },

      // foreign keys
      matchId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'matches',
          key: 'id'
        }
      },
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'MatchEvents' );
  }
};
