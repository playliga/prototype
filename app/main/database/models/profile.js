import { Model } from 'sequelize';


class Profile extends Model {
  static init( sequelize ) {
    return super.init({
      // @todo
    }, { sequelize });
  }

  static associate( models ) {
    this.belongsTo( models.Team );
    this.belongsTo( models.Player );
  }
}


export default Profile;
