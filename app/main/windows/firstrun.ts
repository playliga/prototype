import path from 'path';
import { ipcMain, Menu } from 'electron';
import is from 'electron-is';

import { IterableObject } from 'shared/types';
import { Window } from 'main/lib/window-manager/types';
import WindowManager from 'main/lib/window-manager';
import DefaultMenuTemplate from 'main/lib/default-menu';
import { League } from 'main/lib/league';
import { Team, Player, Country, Profile, Continent, Compdef, Competition } from 'main/database/models';


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


let win: Window;


/**
 * World gen functions
 */

async function saveplayer( data: IterableObject<any>[] ) {
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

  // build player object
  let player = Player.build({
    alias: userinfo.alias,
    tier: 4,
  });
  player = await player.save();

  // create the new user profile
  let profile = Profile.build();
  profile = await profile.save();

  // save associations and return as a single promise
  return Promise.all([
    team.setCountry( teamcountry as Country ),
    player.setTeam( team ),
    player.setCountry( playercountry as Country ),
    profile.setTeam( team ),
    profile.setPlayer( player )
  ]);
}


async function gencomps() {
  // get regions and their teams
  const [ eu, na ] = await Continent.findAll({
    where: { id: [ 4, 5 ] }
  });
  const euteams = await Team.findByRegionId( eu.id );
  const nateams = await Team.findByRegionId( na.id );

  // get the esea compdef
  const eseacompdef = await Compdef.findOne({ where: { name: 'ESEA' }});

  if( !eseacompdef ) {
    return;
  }

  // build the esea league per region
  const data = [
    { region: eu, teams: euteams },
    { region: na, teams: nateams },
  ];

  return Promise.all( data.map( async item => {

    // build the esea league object
    const { region, teams } = item;
    const esealeague = new League( eseacompdef.name );

    // add teams to the esea tiers
    eseacompdef.tiers.forEach( ( tier, tdx ) => {
      const div = esealeague.addDivision( tier.name, tier.minlen, tier.confsize );
      const tierteams = teams.filter( t => t.tier === tdx );
      div.addCompetitors( tierteams.slice( 0, tier.minlen ).map( t => t.id.toString() ) );
    });

    // save the league as a competition
    const comp = Competition.build({ data: esealeague });
    await comp.save();

    // save its associations
    return Promise.all([
      comp.setCompdef( eseacompdef ),
      comp.setContinents([ region ]),
    ]);

  }) );
}


function openmainwindow() {
  // wait a few seconds before opening the main window
  setTimeout( () => {
    ipcMain.emit( '/windows/main/open' );
    win.handle.close();
  }, 2000 );
}


/**
 * IPC Handlers
 */

async function saveFirstRunHandler( evt: object, data: IterableObject<any>[] ) {
  // save the player information
  saveplayer( data )

    // once that is done, generate the competitions
    .then( gencomps )

    // finished!
    .then( openmainwindow )
  ;
}


function openWindowHandler() {
  win = WindowManager.createWindow(
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


export default () => {
  // ipc listeners
  ipcMain.on( '/windows/firstrun/open', openWindowHandler );
  ipcMain.on( '/windows/firstrun/save', saveFirstRunHandler );
};
