import Sequelize, { Model } from 'sequelize';


class CompetitionTeams extends Model {
  static autoinit( sequelize ) {
    return this.init({
      result: {
        allowNull: true,
        type: Sequelize.Sequelize.JSON,
      },
    }, { sequelize, modelName: 'CompetitionTeams' });
  }
}


export default CompetitionTeams;
