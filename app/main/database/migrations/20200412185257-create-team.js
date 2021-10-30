module.exports = {
  up: ( queryInterface, Sequelize ) => {
    return queryInterface.createTable( 'Teams', {
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
      tag: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      logo: {
        type: Sequelize.STRING,
        defaultValue: '',
      },
      earnings: {
        type: Sequelize.NUMBER,
        defaultValue: 0,
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
      countryId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'countries',
          key: 'id'
        }
      },
    });
  },
  down: ( queryInterface ) => {
    return queryInterface.dropTable( 'Teams' );
  }
};
