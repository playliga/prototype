export default ( sequelize, DataTypes ) => {
  const FIELDS = {};
  const OPTIONS = {
    timestamps: false,
    classMethods: {}
  };

  let model = null;

  FIELDS.code = {
    type: DataTypes.STRING( 2 ),
    allowNull: false,
    unique: true
  };

  FIELDS.name = {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  };

  OPTIONS.classMethods.associate = ( models ) => {
    model.hasMany( models.country );
  };

  model = sequelize.define( 'continent', FIELDS, OPTIONS );
  return model;
};