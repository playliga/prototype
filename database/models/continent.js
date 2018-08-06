import { Model, DataTypes } from 'sequelize';

module.exports = class Continent extends Model {
  FIELDS = {
    code: {
      type: DataTypes.STRING( 2 ),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING( 64 ),
      allowNull: false,
      unique: true
    }
  }

  static init( sequelize ) {
    return super.init( this.FIELDS, { sequelize });
  }

  static associate( models ) {
    this.hasMany( models.Country );
  }
};