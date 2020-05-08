import Sequelize, { Model } from 'sequelize';


class PersonaType extends Model {
  static autoinit( sequelize ) {
    return this.init({
      name: Sequelize.STRING,
    }, { sequelize, modelName: 'PersonaType' });
  }

  static associate( models ) {
    this.hasMany( models.Persona );
  }
}

export default PersonaType;
