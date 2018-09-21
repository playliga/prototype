import { Model, DataTypes } from 'sequelize';

module.exports = class Meta extends Model {
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
    return super.init( Meta.FIELDS, {
      ...Meta.OPTIONS,
      sequelize
    });
  }

  static associate( models ) {
    this.belongsToMany( models.Player, { through: models.MetaPlayer });
    this.belongsToMany( models.Team, { through: models.MetaTeam });
  }
};