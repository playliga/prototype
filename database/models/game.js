import { Model, DataTypes } from 'sequelize';

module.exports = class Game extends Model {
  static FIELDS = {
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

  static OPTIONS = {
    timestamps: false
  }

  static init( sequelize ) {
    return super.init( Game.FIELDS, {
      ...Game.OPTIONS,
      sequelize
    });
  }

  static associate( models ) {
    this.hasMany( models.Player );
    this.hasMany( models.Team );
  }
};