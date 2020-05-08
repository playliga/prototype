import Sequelize, { Model } from 'sequelize';


class Persona extends Model {
  static autoinit( sequelize ) {
    return this.init({
      fname: Sequelize.STRING,
      lname: Sequelize.STRING,
    }, { sequelize, modelName: 'Persona' });
  }

  static associate( models ) {
    this.hasMany( models.Email );
    this.belongsTo( models.Team );
    this.belongsTo( models.Country );
    this.belongsTo( models.PersonaType );
  }
}

export default Persona;
