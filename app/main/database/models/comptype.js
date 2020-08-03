import Sequelize, { Model } from 'sequelize';


class Comptype extends Model {
  static autoinit( sequelize ) {
    return this.init({
      name: {
        type: Sequelize.STRING,
        unique: true
      },
    }, { sequelize, modelName: 'Comptype' });
  }

  static associate( models ) {
    this.hasMany( models.Compdef );
    this.hasMany( models.Competition );
  }
}


export default Comptype;
