import path from 'path';
import { ipcMain, Menu } from 'electron';
import is from 'electron-is';

import { IterableObject } from 'shared/types';
import WindowManager from 'main/lib/window-manager';
import DefaultMenuTemplate from 'main/lib/default-menu';
import { Team, Player, Country, Profile } from 'main/database/models';


// module-level variables and constants
const PORT = process.env.PORT || 3000;
const WIDTH = 800;
const HEIGHT = 600;
const CONFIG = {
  url: is.production()
    ? `file://${path.join( __dirname, 'dist/renderer/windows/firstrun/index.html' )}`
    : `http://localhost:${PORT}/windows/firstrun/index.html`,
  opts: {
    backgroundColor: '#f5f5f5', // "whitesmoke"
    width: WIDTH,
    height: HEIGHT,
    minWidth: WIDTH,
    minHeight: HEIGHT
  }
};


// world gen!

/**********************************************************************************
async function genleagues() {
  // get necessary data from datastores
  const datastores = Database.datastores;
  const compdefs = await datastores.compdefs.find() as unknown as Compdef[];
  const nateams = await datastores.teams.find({ region: 1 }) as unknown as Team[];

  // generate esea league
  const esea = compdefs.find( item => item.id === 'esea' );

  if( esea ) {
    const esealeague = new League( esea.name );

    // add teams to the esea tiers
    if( Array.isArray( esea.tiers ) ) {
      esea.tiers.forEach( ( tier, tdx ) => {
        const div = esealeague.addDivision( tier.name, tier.minlen, tier.confsize );
        const teams = nateams.filter( t => t.tier === tdx );
        div.addCompetitors( teams.slice( 0, tier.minlen ).map( t => t._id ) );
      });
    }

    // save it
    await datastores.competitions.insert( esealeague );
  }
}
**********************************************************************************/


// ipc handlers
function openWindowHandler() {
  const win = WindowManager.createWindow(
    '/windows/firstrun',
    CONFIG.url,
    CONFIG.opts
  );
  win.handle.setMenu( DefaultMenuTemplate );

  // the `setMenu` function above doesn't work on
  // osx so we'll have to accomodate for that
  if( is.osx() ) {
    Menu.setApplicationMenu( DefaultMenuTemplate );
  }
}


async function saveFirstRunHandler( evt: object, data: IterableObject<any>[] ) {
  const [ userinfo, teaminfo ] = data;

  // get the countryids
  const teamcountry = await Country.findOne({ where: { name: teaminfo.country }});
  const playercountry = await Country.findOne({ where: { name: userinfo.country }});

  // build team object
  let team = Team.build({
    name: teaminfo.name,
    tier: 4,
  });
  team = await team.save();
  if( teamcountry ) {
    await team.setCountry( teamcountry );
  }

  // build player object
  let player = Player.build({
    alias: userinfo.alias,
    tier: 4,
  });
  player = await player.save();
  await player.setTeam( team );
  if( playercountry ) {
    await player.setCountry( playercountry );
  }

  // create the new user profile
  let profile = Profile.build();
  profile = await profile.save();
  await profile.setTeam( team );
  await profile.setPlayer( player );
}


export default () => {
  // ipc listeners
  ipcMain.on( '/windows/firstrun/open', openWindowHandler );
  ipcMain.on( '/windows/firstrun/save', saveFirstRunHandler );
};
