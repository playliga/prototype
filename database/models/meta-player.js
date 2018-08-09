import { Model, DataTypes } from 'sequelize';

module.exports = class MetaPlayer extends Model {
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
    return super.init( MetaPlayer.FIELDS, {
      ...MetaPlayer.OPTIONS,
      sequelize
    });
  }
};