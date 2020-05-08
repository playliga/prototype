module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Personas', {
      // main fields
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fname: Sequelize.STRING,
      lname: Sequelize.STRING,

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
      personaTypeId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'personatypes',
          key: 'id'
        }
      }
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'Personas' );
  }
};
