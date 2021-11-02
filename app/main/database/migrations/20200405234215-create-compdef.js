module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Compdefs', {
      // id field
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      // general fields
      isOpen: {
        type: Sequelize.BOOLEAN
      },
      meetTwice: {
        type: Sequelize.BOOLEAN
      },
      name: {
        type: Sequelize.STRING,
        unique: true
      },
      season: {
        type: Sequelize.INTEGER
      },
      startOffset: {
        type: Sequelize.INTEGER
      },
      tiers: {
        type: Sequelize.JSON,
        allowNull: true
      },
      prizePool: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      // associations
      comptypeId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'comptypes',
          key: 'id'
        }
      },

      // timestamps
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
    return queryInterface.dropTable( 'Compdefs' );
  }
};
