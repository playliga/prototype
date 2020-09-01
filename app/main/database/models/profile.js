import Sequelize, { Model } from 'sequelize';


let _models = null;


class Profile extends Model {
  static autoinit( sequelize ) {
    return this.init({
      currentDate: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      currentSeason: {
        allowNull: false,
        type: Sequelize.NUMBER,
      },
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
            {
              model: _models.Player,
              include: [{
                model: _models.Country,
                include: [ _models.Continent ]
              }]
            },
            {
              model: _models.Competition,
              include: [ _models.Continent, _models.Comptype ]
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
