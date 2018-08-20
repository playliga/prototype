import { Model, DataTypes } from 'sequelize';

module.exports = class Country extends Model {
  static FIELDS = {
    code: {
      type: DataTypes.STRING( 2 ),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING( 64 ),
      allowNull: false,
      unique: true
    },
    emoji: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  };

  static OPTIONS = {
    timestamps: false
  }

  static init( sequelize ) {
    return super.init( Country.FIELDS, {
      ...Country.OPTIONS,
      sequelize
    });
  }

  static associate( models ) {
    this.belongsTo( models.Continent );
    this.hasMany( models.Team );
    this.hasMany( models.Player );
  }
};