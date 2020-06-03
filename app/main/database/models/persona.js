import Sequelize, { Model } from 'sequelize';


let _models = null;


class Persona extends Model {
  static autoinit( sequelize ) {
    return this.init({
      fname: Sequelize.STRING,
      lname: Sequelize.STRING,
    }, { sequelize, modelName: 'Persona' });
  }

  static associate( models ) {
    if( !_models ) {
      _models = models;
    }

    this.hasMany( _models.Email );
    this.belongsTo( _models.Team );
    this.belongsTo( _models.Country );
    this.belongsTo( _models.PersonaType );
  }

  static getManagerByTeamId( id, type = 'Manager' ) {
    return Persona.findOne({
      include: [
        {
          model: _models.Team,
          where: { id }
        },
        {
          model: _models.PersonaType,
          where: { name: type }
        }
      ]
    });
  }
}


export default Persona;
