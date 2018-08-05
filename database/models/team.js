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

  FIELDS.budget = {
    type: DataTypes.DECIMAL( 10, 2 ),
    defaultValue: 0.00
  };

  OPTIONS.classMethods.associate = ( models ) => {
    model.belongsTo( models.division );
    model.belongsTo( models.game );
    model.belongsTo( models.country );
    model.hasMany( models.player );
  };

  model = sequelize.define( 'team', FIELDS, OPTIONS );
  return model;
};