export default ( sequelize, DataTypes ) => {
  const FIELDS = {};
  const OPTIONS = {
    classMethods: {}
  };

  let model = null;

  FIELDS.username = {
    type: DataTypes.STRING
  };

  OPTIONS.classMethods.associate = ( models ) => {
    // TODO:
  };

  model = sequelize.define( 'player', FIELDS, OPTIONS );
  return model;
};