import * as Models from 'main/database/models';
import ScreenManager from 'main/lib/screen-manager';


const INTROEMAIL_DELAY = 5000;
const INTROEMAIL_TARGET_SCREEN = '/screens/main';


interface EmailPayload {
  from: Models.Persona;
  to: Models.Player;
  subject: string;
  contents: string;
}


export async function sendEmail( payload: EmailPayload ) {
  const email = await Models.Email.create({
    subject: payload.subject,
    contents: payload.contents
  });

  await Promise.all([
    email.setPersona( payload.from ),
    email.setPlayer( payload.to ),
  ]);

  return Promise.resolve( email.id );
}


export async function sendIntroEmail() {
  // get team and player from the saved profile
  const profile = await Models.Profile.findOne({ include: [{ all: true }] });
  const team = profile?.Team;
  const player = profile?.Player;

  // get the asst manager for the user's team
  const persona = await Models.Persona.findOne({
    where: { teamId: team?.id || 1 },
    include: [{
      model: Models.PersonaType,
      where: { name: 'Assistant Manager' }
    }]
  });

  if( !persona || !player ) {
    return;
  }

  const emailid = await sendEmail({
    from: persona,
    to: player,
    subject: 'Hey!',
    contents: 'Just introducing myself. I\'m your assistance manager and really think...'
  });

  const email = await Models.Email.findByPk( emailid, {
    include: [{ all: true }]
  });

  setTimeout( () => {
    ScreenManager
      .getScreenById( INTROEMAIL_TARGET_SCREEN )
      .handle
      .webContents
      .send(
        '/worldgen/email/new',
        JSON.stringify( email )
      )
    ;
  }, INTROEMAIL_DELAY );
}
