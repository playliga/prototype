module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Matches', {
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
      date: {
        type: Sequelize.DATEONLY
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
      competitionId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'competitions',
          key: 'id'
        }
      },
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'Matches' );
  }
};
