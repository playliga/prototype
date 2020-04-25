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
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'Competitions' );
  }
};
