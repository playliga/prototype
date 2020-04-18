import Sequelize, { Model } from 'sequelize';


class Country extends Model {
  static autoinit( sequelize ) {
    return super.init({
      code: { type: Sequelize.STRING, unique: true },
      name: { type: Sequelize.STRING, unique: true },
    }, { sequelize, modelName: 'Country' });
  }

  static associate( models ) {
    this.belongsTo( models.Continent );
    this.hasMany( models.Player );
  }
}


export default Country;
