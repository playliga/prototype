import Sequelize, { Model } from 'sequelize';


class Country extends Model {
  static init( sequelize ) {
    return super.init({
      code: { type: Sequelize.STRING, unique: true },
      name: { type: Sequelize.STRING, unique: true },
    }, { sequelize });
  }

  static associate( models ) {
    this.belongsTo( models.Continent );
    this.hasMany( models.Player );
  }
}


export default Country;
