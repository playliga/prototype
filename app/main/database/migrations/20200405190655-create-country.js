module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Countries', {
      // main fields
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        unique: true
      },
      code: {
        type: Sequelize.STRING,
        unique: true
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
      continentId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'continents',
          key: 'id'
        }
      }
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'Countries' );
  }
};
