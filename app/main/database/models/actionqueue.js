import Sequelize, { Model } from 'sequelize';


class ActionQueue extends Model {
  static autoinit( sequelize ) {
    return this.init({
      actionDate: {
        type: Sequelize.DATEONLY,
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      payload: {
        type: Sequelize.JSON,
      },
      type: {
        type: Sequelize.STRING,
      },
    }, { sequelize, modelName: 'ActionQueue' });
  }
}


export default ActionQueue;
