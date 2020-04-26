import Sequelize, { Model } from 'sequelize';
import { ipcMain } from 'electron';


class Competition extends Model {
  static autoinit( sequelize ) {
    ipcMain.on( '/database/competition/start', this.ipcstart );

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

  // starts the competition
  static async ipcstart( evt, request ) {
    const { id } = request.params;
    const comp = await Competition.findByPk( id );

    // @todo: load a league instance from the data json
    const leagueobj = comp.data;
  }
}


export default Competition;
