import Sequelize, { Model } from 'sequelize';


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
    this.belongsTo( models.Comptype );
    this.belongsTo( models.Compdef );
    this.belongsTo( models.Continent );
    this.belongsToMany( models.Team, { through: 'CompetitionTeams' });
  }
}


export default Competition;
