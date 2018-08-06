import { Model, DataTypes } from 'sequelize';

module.exports = class Division extends Model {
  FIELDS = {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }

  static init( sequelize ) {
    return super.init( this.FIELDS, { sequelize });
  }

  static associate( models ) {
    this.hasMany( models.Team );
  }
};