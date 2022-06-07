module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Competitions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      data: {
        allowNull: false,
        type: Sequelize.JSON,
      },
      season: {
        allowNull: true,
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      seasonYear: {
        allowNull: false,
        type: Sequelize.NUMBER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      compdefId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'compdefs',
          key: 'id'
        }
      },
      comptypeId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'comptypes',
          key: 'id'
        }
      },
      continentId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'continents',
          key: 'id'
        }
      },
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'Competitions' );
  }
};
