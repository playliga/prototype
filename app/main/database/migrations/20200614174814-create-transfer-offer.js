module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'TransferOffers', {
      // main fields
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      status: Sequelize.STRING,
      fee: Sequelize.INTEGER,
      wages: Sequelize.INTEGER,
      msg: Sequelize.STRING,

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
      },
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'TransferOffers' );
  }
};
