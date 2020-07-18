import Sequelize, { Model } from 'sequelize';


class Continent extends Model {
  static autoinit( sequelize ) {
    return this.init({
      code: { type: Sequelize.STRING, unique: true },
      name: { type: Sequelize.STRING, unique: true },
    }, { sequelize, modelName: 'Continent' });
  }

  static associate( models ) {
    this.hasMany( models.Country );
    this.belongsToMany( models.Compdef, { through: 'CompdefContinents' });
    this.belongsToMany( models.Competition, { through: 'CompetitionContinents' });
  }
}


export default Continent;
