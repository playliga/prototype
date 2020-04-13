import path from 'path';
import { ipcMain, Menu } from 'electron';
import is from 'electron-is';

import { IterableObject } from 'main/types';
import WindowManager from 'main/lib/window-manager';
import DefaultMenuTemplate from 'main/lib/default-menu';


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
  // const datastores = Database.datastores;
  const [ userinfo, teaminfo ] = data;

  // build team object
  const team = {
    region: 1,            // @todo
    tier: 4,
    name: teaminfo.name,
    countrycode: 'us',    // @todo
    players: [] as string[],
  };

  // build player object
  const player = {
    name: userinfo.name,
    alias: userinfo.alias
  };

  // get the unique id from the db after saving the player.
  // then update the team's roster with that player.
  /***************************************************************************************************
  const newplayer = await datastores.players.insert( player ) as unknown as Player;
  team.players.push( newplayer._id );

  // save the team and then update the player with the teamid
  const newteam = await datastores.teams.insert( team ) as unknown as Team;
  await datastores.players.update({ _id: newplayer._id }, { ...newplayer, teamid: newteam._id });

  // update the userdata db
  await datastores.userdata.insert({
    teamid: newteam._id,
    playerid: newplayer._id
  });

  // resync the database file
  await datastores.players.resync();
  // genleagues();
  ***************************************************************************************************/
}


export default () => {
  // ipc listeners
  ipcMain.on( '/windows/firstrun/open', openWindowHandler );
  ipcMain.on( '/windows/firstrun/save', saveFirstRunHandler );
};
