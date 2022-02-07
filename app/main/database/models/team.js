import Sequelize, { Model, Op } from 'sequelize';


let _models = null;


class Team extends Model {
  static autoinit( sequelize ) {
    return this.init({
      name: {
        type: Sequelize.STRING,
        unique: true
      },
      shortName: {
        type: Sequelize.STRING,
        allowNull: true,
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
      tier: {
        type: Sequelize.INTEGER,
      },
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
    this.belongsToMany( _models.Competition, { through: _models.CompetitionTeams });
    this.belongsToMany( _models.Match, { through: 'MatchTeams' });
  }

  static findByRegionIds( ids ) {
    return Team.findAll({
      include: [{
        model: _models.Country,
        where: {
          continentId: {
            [Op.or]: ids
          }
        }
      }]
    });
  }

  static findByName( name ) {
    return Team.findOne({
      where: { name },
      include: [
        _models.Player,
        _models.Country
      ]
    });
  }

  static findWithSquad( id ) {
    return Team.findByPk( id, {
      include: [ _models.Player ]
    });
  }
}


export default Team;
