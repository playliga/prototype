module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Profiles', {
      // main fields
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      currentDate: {
        allowNull: true,
        default: Date.now(),
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
      teamId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'teams',
          key: 'id'
        }
      },
      playerId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'players',
          key: 'id'
        }
      }
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'Profiles' );
  }
};
