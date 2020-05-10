module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Emails', {
      // main fields
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      subject: Sequelize.STRING,
      content: Sequelize.STRING,

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
      personaId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'personas',
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
    return queryInterface.dropTable( 'Emails' );
  }
};
