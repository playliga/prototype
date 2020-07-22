import Sequelize, { Model } from 'sequelize';


let _models = null;


class Profile extends Model {
  static autoinit( sequelize ) {
    return this.init({
      currentDate: {
        allowNull: true,
        defaultValue: Sequelize.NOW,
        type: Sequelize.DATEONLY
      }
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
          include: [
            _models.Player,
            {
              model: _models.Competition,
              include: [ _models.Continent ]
            },
            {
              model: _models.Country,
              include: [ _models.Continent ]
            }
          ]
        }
      ]
    });
  }
}


export default Profile;
