import Sequelize, { Model } from 'sequelize';


class Player extends Model {
  static autoinit( sequelize ) {
    return super.init({
      alias: { type: Sequelize.STRING, unique: true },
      tier: Sequelize.INTEGER,
    }, { sequelize, modelName: 'Player' });
  }

  static associate( models ) {
    this.belongsTo( models.Team );
    this.belongsTo( models.Country );
    this.hasOne( models.Profile );
  }
}

export default Player;
