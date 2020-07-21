import Sequelize, { Model } from 'sequelize';


class Compdef extends Model {
  static autoinit( sequelize ) {
    return this.init({
      name: { type: Sequelize.STRING, unique: true },
      season: Sequelize.INTEGER,
      isOpen: Sequelize.BOOLEAN,
      tiers: Sequelize.JSON,
      startOffset: Sequelize.INTEGER,
    }, { sequelize, modelName: 'Compdef' });
  }

  static associate( models ) {
    this.belongsToMany( models.Continent, { through: 'CompdefContinents' });
  }
}


export default Compdef;
