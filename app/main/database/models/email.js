import Sequelize, { Model } from 'sequelize';


class Email extends Model {
  static autoinit( sequelize ) {
    return this.init({
      subject: Sequelize.STRING,
      contents: Sequelize.STRING,
    }, { sequelize, modelName: 'Email' });
  }

  static associate( models ) {
    this.belongsTo( models.Persona );
    this.belongsTo( models.Player );
  }
}


export default Email;
