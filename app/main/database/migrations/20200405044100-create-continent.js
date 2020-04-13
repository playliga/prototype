module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Continents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        unique: true
      },
      name: {
        type: Sequelize.STRING
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
  down: ( queryInterface ) => {
    return queryInterface.dropTable( 'Continents' );
  }
};
