import Sequelize, { Model } from 'sequelize';


class Match extends Model {
  static autoinit( sequelize ) {
    return this.init({
      payload: {
        type: Sequelize.JSON,
      },
      date: {
        type: Sequelize.DATEONLY
      },
    }, { sequelize, modelName: 'Match' });
  }

  static associate( models ) {
    this.belongsToMany( models.Team, { through: 'MatchTeams' });
    this.belongsTo( models.Competition );
  }
}


export default Match;
