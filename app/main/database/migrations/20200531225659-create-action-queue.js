module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'ActionQueues', {
      // main fields
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      actionDate: {
        type: Sequelize.DATEONLY,
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      payload: {
        type: Sequelize.JSON,
      },
      type: {
        type: Sequelize.STRING,
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
    });
  },
  down: (queryInterface ) => {
    return queryInterface.dropTable( 'ActionQueues' );
  }
};
