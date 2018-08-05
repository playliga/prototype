export default ( sequelize, DataTypes ) => {
  const FIELDS = {};
  const OPTIONS = {
    timestamps: false,
    classMethods: {}
  };

  let model = null;

  FIELDS.name = {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  };

  OPTIONS.classMethods.associate = ( models ) => {
    model.hasMany( models.team );
  };

  model = sequelize.define( 'division', FIELDS, OPTIONS );
  return model;
};