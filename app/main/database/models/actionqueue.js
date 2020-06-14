import Sequelize, { Model } from 'sequelize';


class ActionQueue extends Model {
  static autoinit( sequelize ) {
    return this.init({
      type: Sequelize.STRING,
      actionDate: Sequelize.DATEONLY,
      payload: Sequelize.JSON,
    }, { sequelize, modelName: 'ActionQueue' });
  }
}


export default ActionQueue;
