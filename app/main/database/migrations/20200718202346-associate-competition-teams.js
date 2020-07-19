module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'CompetitionTeams', {
      competitionId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      teamId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
    return queryInterface.dropTable( 'CompetitionTeams' );
  }
};
