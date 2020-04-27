import Sequelize, { Model } from 'sequelize';
import { League } from 'main/lib/league';


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
  }

  /**
   * ipc handlers
   */

  static async startLeague( args ) {
    // restore league object and start it
    const comp = await Competition.findByPk( args.id );
    const league = League.restore( comp.data );
    league.start();

    // replace the old data with the new league object
    return comp.update({ data: league });
  }
}


export default Competition;
