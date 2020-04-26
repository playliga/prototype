import Sequelize, { Model } from 'sequelize';
import Country from './country';


class Team extends Model {
  static autoinit( sequelize ) {
    return this.init({
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

  static findByRegionId( id ) {
    return Team.findAll({
      include: [{
        model: Country,
        where: { continentId: id }
      }]
    });
  }
}


export default Team;
