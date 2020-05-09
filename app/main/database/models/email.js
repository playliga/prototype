import Sequelize, { Model } from 'sequelize';


class Email extends Model {
  static autoinit( sequelize ) {
    return this.init({
      subject: Sequelize.STRING,
      contents: Sequelize.STRING,
    }, { sequelize, modelName: 'Email' });
  }

  static associate( models ) {
    this.belongsTo( models.Persona );
    this.belongsTo( models.Player );
  }

  static async send( payload ) {
    const email = await Email.create({
      subject: payload.subject,
      contents: payload.contents
    });

    await Promise.all([
      email.setPersona( payload.from ),
      email.setPlayer( payload.to ),
    ]);

    return Promise.resolve( email.id );
  }
}


export default Email;
