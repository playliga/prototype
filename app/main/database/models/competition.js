import Sequelize, { Model } from 'sequelize';


let _models = null;


class Competition extends Model {
  static autoinit( sequelize ) {
    return this.init({
      data: {
        allowNull: false,
        type: Sequelize.JSON,
      },
      season: {
        allowNull: true,
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
    }, { sequelize, modelName: 'Competition' });
  }

  static associate( models ) {
    if( !_models ) {
      _models = models;
    }
    this.hasMany( models.Match );
    this.belongsTo( models.Comptype );
    this.belongsTo( models.Compdef );
    this.belongsTo( models.Continent );
    this.belongsToMany( models.Team, { through: models.CompetitionTeams });
  }

  static findAllByTeam( id ) {
    return Competition.findAll({
      include: [
        _models.Continent,
        _models.Comptype,
        _models.Compdef,
        {
          model: _models.Team,
          where: { id }
        },
      ]
    });
  }
}


export default Competition;
