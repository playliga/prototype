import Sequelize, { Model } from 'sequelize';


let _models = null;


class Email extends Model {
  static autoinit( sequelize ) {
    return this.init({
      subject: Sequelize.STRING,
      content: Sequelize.STRING,
      read: { type: Sequelize.BOOLEAN, defaultValue: false },
      sentAt: Sequelize.DATEONLY,
    }, { sequelize, modelName: 'Email' });
  }

  static associate( models ) {
    if( !_models ) {
      _models = models;
    }

    this.belongsTo( _models.Persona );
    this.belongsTo( _models.Player );
  }

  static async send( payload ) {
    const email = await Email.create({
      subject: payload.subject,
      content: payload.content,
      sentAt: payload.sentAt
    });

    await Promise.all([
      email.setPersona( payload.from ),
      email.setPlayer( payload.to ),
    ]);

    return Email.findByPk( email.id, {
      include: [{ all: true }]
    });
  }
}


export default Email;
