import Sequelize, { Model } from 'sequelize';


class MatchEvent extends Model {
  static autoinit( sequelize ) {
    return this.init({
      payload: {
        type: Sequelize.JSON,
      },
      type: {
        type: Sequelize.STRING,
      },
    }, { sequelize, modelName: 'MatchEvent' });
  }

  static associate( models ) {
    this.belongsTo( models.Match );
  }
}


export default MatchEvent;
