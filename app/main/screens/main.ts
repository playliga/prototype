import path from 'path';
import { ipcMain, Menu } from 'electron';
import is from 'electron-is';
import ScreenManager from 'main/lib/screen-manager';
import DefaultMenuTemplate from 'main/lib/default-menu';
import { Profile, Persona, PersonaType, Email } from 'main/database/models';


// module-level variables and constants
const PORT = process.env.PORT || 3000;
const WIDTH = 1024;
const HEIGHT = 768;
const CONFIG = {
  url: is.production()
    ? `file://${path.join( __dirname, 'dist/renderer/screens/main/index.html' )}`
    : `http://localhost:${PORT}/screens/main/index.html`,
  opts: {
    backgroundColor: '#f5f5f5', // "whitesmoke"
    width: WIDTH,
    height: HEIGHT,
    minWidth: WIDTH,
    minHeight: HEIGHT
  }
};


/**
 * Utility functions
 */

async function sendEmail( from: Persona, to: Player ) {
  const email = await Email.create({
    subject: 'Hey!',
    contents: 'Just introducing myself. I\'m your assistance manager and really think...'
  });

  await Promise.all([
    email.setPersona( from ),
    email.setPlayer( to ),
  ]);

  return Promise.resolve( email.id );
}


/**
 * Screen IPC handlers
 */

async function openWindowHandler() {
  const screen = ScreenManager.createScreen( '/screens/main', CONFIG.url, CONFIG.opts );
  screen.handle.setMenu( DefaultMenuTemplate );

  // the `setMenu` function above doesn't work on
  // osx so we'll have to accomodate for that
  if( is.osx() ) {
    Menu.setApplicationMenu( DefaultMenuTemplate );
  }
}


async function introEmailHandler() {
  // get team and player from the saved profile
  const profile = await Profile.findOne({ include: [{ all: true }] });
  const team = profile?.Team;
  const player = profile?.Player;

  // get the asst manager for the user's team
  const persona = await Persona.findOne({
    where: { teamId: team?.id || 1 },
    include: [{
      model: PersonaType,
      where: { name: 'Assistant Manager' }
    }]
  });

  if( !persona ) {
    return;
  }

  const emailid = await sendEmail( persona, player );
  const email = await Email.findByPk( emailid, {
    include: [{ all: true }]
  });

  setTimeout( () => {
    ScreenManager
      .getScreenById( '/screens/main' )
      .handle
      .webContents
      .send(
        '/screens/main/email/new',
        JSON.stringify( email )
      )
    ;
  }, 5000 );
}


export default () => {
  // ipc listeners
  ipcMain.on( '/screens/main/open', openWindowHandler );
  ipcMain.on( '/screens/main/intro-email', introEmailHandler );
};
