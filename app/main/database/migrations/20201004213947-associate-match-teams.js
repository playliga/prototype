module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'MatchTeams', {
      matchId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'matches',
          key: 'id'
        }
      },
      teamId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: {
          model: 'teams',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'MatchTeams' );
  }
};
