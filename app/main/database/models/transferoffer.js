import Sequelize, { Model } from 'sequelize';


let _models = null;


class TransferOffer extends Model {
  static autoinit( sequelize ) {
    return this.init({
      status: Sequelize.STRING,
      fee: Sequelize.INTEGER,
      wages: Sequelize.INTEGER,
      msg: Sequelize.STRING,
    }, { sequelize, modelName: 'TransferOffer' });
  }

  static associate( models ) {
    if( !_models ) {
      _models = models;
    }

    this.belongsTo( _models.Player );
    this.belongsTo( _models.Team );
  }

  static getPlayerOffers( id ) {
    return TransferOffer.findAll({
      where: { playerId: id },
      order: [[ 'id', 'DESC' ]],
      include: [
        {
          model: _models.Player,
          include: [{
            model: _models.Team
          }]
        },
        {
          model: _models.Team,
        }
      ]
    });
  }
}


export default TransferOffer;
