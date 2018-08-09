import { Model, DataTypes } from 'sequelize';

module.exports = class Player extends Model {
  static FIELDS = {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    transferValue: {
      type: DataTypes.DECIMAL( 10, 2 ),
      defaultValue: 0.00
    }
  }

  static OPTIONS = {
    timestamps: false
  }

  static init( sequelize ) {
    return super.init( Player.FIELDS, {
      ...Player.OPTIONS,
      sequelize
    });
  }

  static associate( models ) {
    this.belongsTo( models.Team );
    this.belongsTo( models.Game );
    this.belongsTo( models.Country );
    this.belongsToMany( models.Meta, { through: models.MetaPlayer });
  }
};