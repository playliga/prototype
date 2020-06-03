import { Model } from 'sequelize';


let _models = null;


class Profile extends Model {
  static autoinit( sequelize ) {
    return this.init({
      // @todo
    }, { sequelize, modelName: 'Profile' });
  }

  static associate( models ) {
    if( !_models ) {
      _models = models;
    }
    this.belongsTo( _models.Team );
    this.belongsTo( _models.Player );
  }

  static getActiveProfile() {
    return Profile.findOne({
      include: [
        {
          model: _models.Player,
          include: [{
            model: _models.Country,
            include: [ _models.Continent ]
          }]
        },
        {
          model: _models.Team,
          include: [{
            model: _models.Country,
            include: [ _models.Continent ]
          }]
        }
      ]
    });
  }
}


export default Profile;
