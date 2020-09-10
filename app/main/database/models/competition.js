import Sequelize, { Model } from 'sequelize';


class Competition extends Model {
  static autoinit( sequelize ) {
    return this.init({
      data: {
        allowNull: false,
        type: Sequelize.JSON,
      },
    }, { sequelize, modelName: 'Competition' });
  }

  static associate( models ) {
    this.belongsTo( models.Comptype );
    this.belongsTo( models.Compdef );
    this.belongsTo( models.Continent );
    this.belongsToMany( models.Team, { through: 'CompetitionTeams' });
  }
}


export default Competition;
