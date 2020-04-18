import Sequelize, { Model } from 'sequelize';


class Team extends Model {
  static autoinit( sequelize ) {
    return super.init({
      name: { type: Sequelize.STRING, unique: true },
      tag: { type: Sequelize.STRING, defaultValue: '' },
      tier: Sequelize.INTEGER,
      logo: { type: Sequelize.STRING, defaultValue: '' }
    }, { sequelize, modelName: 'Team' });
  }

  static associate( models ) {
    this.hasMany( models.Player );
    this.hasOne( models.Profile );
    this.belongsTo( models.Country );
  }
}


export default Team;
