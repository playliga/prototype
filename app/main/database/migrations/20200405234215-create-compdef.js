module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Compdefs', {
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
      season: {
        type: Sequelize.INTEGER
      },
      tiers: {
        type: Sequelize.JSON
      },
      isOpen: {
        type: Sequelize.BOOLEAN
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
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'Compdefs' );
  }
};
