import Sequelize, { Model } from 'sequelize';


class Player extends Model {
  static autoinit( sequelize ) {
    return this.init({
      alias: { type: Sequelize.STRING },
      transferListed: { type: Sequelize.BOOLEAN, defaultValue: false },
      transferValue: { type: Sequelize.INTEGER, defaultValue: 0 },
      monthlyWages: { type: Sequelize.INTEGER, defaultValue: 0 },
      eligibleDate: { type: Sequelize.DATEONLY, allowNull: true },
      tier: Sequelize.INTEGER,
      starter: Sequelize.BOOLEAN,
      stats: { type: Sequelize.JSON, allowNull: true },
    }, { sequelize, modelName: 'Player' });
  }

  static associate( models ) {
    this.belongsTo( models.Team );
    this.belongsTo( models.Country );
    this.hasOne( models.Profile );
    this.hasMany( models.Email );
  }
}


export default Player;
