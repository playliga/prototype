import { Model } from 'sequelize';


class Profile extends Model {
  static autoinit( sequelize ) {
    return super.init({
      // @todo
    }, { sequelize, modelName: 'Profile' });
  }

  static associate( models ) {
    this.belongsTo( models.Team );
    this.belongsTo( models.Player );
  }
}


export default Profile;
