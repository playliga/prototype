import Sequelize, { Model } from 'sequelize';


class Compdef extends Model {
  static init( sequelize ) {
    return super.init({
      name: { type: Sequelize.STRING, unique: true },
      season: Sequelize.INTEGER,
      tiers: Sequelize.JSON
    }, { sequelize });
  }

  static associate( models ) {
    this.belongsToMany( models.Continent, { through: 'CompdefContinents' });
  }
}


export default Compdef;
