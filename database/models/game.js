import { Model, DataTypes } from 'sequelize';

module.exports = class Game extends Model {
  FIELDS = {
    name: {
      type: DataTypes.STRING( 128 ),
      allowNull: false,
      unique: true
    },
    shortname: {
      type: DataTypes.STRING( 16 ),
      allowNull: false,
      unique: true
    }
  };

  static init( sequelize ) {
    return super.init( this.FIELDS, { sequelize });
  }

  static associate( models ) {
    this.hasMany( models.Player );
    this.hasMany( models.Team );
  }
};