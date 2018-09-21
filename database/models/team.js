import { Model, DataTypes } from 'sequelize';

module.exports = class Team extends Model {
  static FIELDS = {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    budget: {
      type: DataTypes.DECIMAL( 10, 2 ),
      defaultValue: 0.00
    }
  }

  static OPTIONS = {
    timestamps: false
  }

  static init( sequelize ) {
    return super.init( Team.FIELDS, {
      ...Team.OPTIONS,
      sequelize
    });
  }

  static associate( models ) {
    this.belongsTo( models.Division );
    this.belongsTo( models.Game );
    this.belongsTo( models.Country );
    this.hasMany( models.Player );
    this.belongsToMany( models.Meta, { through: models.MetaTeam });
  }
};