import { Model, DataTypes } from 'sequelize';

module.exports = class Division extends Model {
  static FIELDS = {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }

  static OPTIONS = {
    timestamps: false
  }

  static init( sequelize ) {
    return super.init( Division.FIELDS, {
      ...Division.OPTIONS,
      sequelize
    });
  }

  static associate( models ) {
    this.hasMany( models.Team );
  }
};