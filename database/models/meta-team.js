import { Model, DataTypes } from 'sequelize';

module.exports = class MetaTeam extends Model {
  static FIELDS = {
    value: {
      type: DataTypes.JSON,
      allowNull: false
    }
  }

  static OPTIONS = {
    timestamps: false
  }

  static init( sequelize ) {
    return super.init( MetaTeam.FIELDS, {
      ...MetaTeam.OPTIONS,
      sequelize
    });
  }
};