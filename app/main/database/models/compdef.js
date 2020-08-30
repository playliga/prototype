import Sequelize, { Model } from 'sequelize';


class Compdef extends Model {
  static autoinit( sequelize ) {
    return this.init({
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
    }, { sequelize, modelName: 'Compdef' });
  }

  static associate( models ) {
    this.belongsTo( models.Comptype );
    this.belongsToMany( models.Continent, { through: 'CompdefContinents' });
  }
}


export default Compdef;
