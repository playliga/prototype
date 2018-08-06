import { Model, DataTypes } from 'sequelize';

module.exports = class Country extends Model {
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
  };

  static init( sequelize ) {
    return super.init( this.FIELDS, { sequelize });
  }

  static associate( models ) {
    this.belongsTo( models.Continent );
    this.hasMany( models.Team );
    this.hasMany( models.Player );
  }
};