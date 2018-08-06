export default ( sequelize, DataTypes ) => {
  const FIELDS = {};
  const OPTIONS = {
    timestamps: false,
    classMethods: {}
  };

  let model = null;

  FIELDS.name = {
    type: DataTypes.STRING( 128 ),
    allowNull: false,
    unique: true
  };

  FIELDS.shortname = {
    type: DataTypes.STRING( 16 ),
    allowNull: false,
    unique: true
  };

  OPTIONS.classMethods.associate = ( models ) => {
    model.hasMany( models.user );
    model.hasMany( models.team );
  };

  model = sequelize.define( 'game', FIELDS, OPTIONS );
  return model;
};