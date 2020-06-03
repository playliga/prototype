import Sequelize, { Model } from 'sequelize';


let _models = null;


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
    if( !_models ) {
      _models = models;
    }
    this.hasMany( _models.Player );
    this.hasMany( _models.Persona );
    this.hasOne( _models.Profile );
    this.belongsTo( _models.Country );
  }

  static findByRegionId( id ) {
    return Team.findAll({
      include: [{
        model: _models.Country,
        where: { continentId: id }
      }]
    });
  }
}


export default Team;
