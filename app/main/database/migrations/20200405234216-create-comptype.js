module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Comptypes', {
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
  down: ( queryInterface ) => {
    return queryInterface.dropTable( 'Comptypes' );
  }
};
