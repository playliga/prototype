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
    this.belongsTo( models.Compdef );
    this.belongsToMany( models.Continent, { through: 'CompetitionContinents' });
    this.belongsToMany( models.Team, { through: 'CompetitionTeams' });
  }
}


export default Competition;
