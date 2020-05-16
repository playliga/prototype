module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Players', {
      // main fields
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      alias: {
        type: Sequelize.STRING,
        unique: true
      },
      transferListed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      tier: Sequelize.INTEGER,

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
      countryId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'countries',
          key: 'id'
        }
      },
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'Players' );
  }
};
