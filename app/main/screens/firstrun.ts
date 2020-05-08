import path from 'path';
import { ipcMain, Menu } from 'electron';
import is from 'electron-is';
import { random } from 'lodash';

import { IterableObject } from 'shared/types';
import { Screen } from 'main/lib/screen-manager/types';
import ScreenManager from 'main/lib/screen-manager';
import DefaultMenuTemplate from 'main/lib/default-menu';
import { League } from 'main/lib/league';
import { Team, Player, Country, Profile, Continent, Compdef, Competition, Persona } from 'main/database/models';


// module-level variables and constants
const PORT = process.env.PORT || 3000;
const WIDTH = 800;
const HEIGHT = 650;
const CONFIG = {
  url: is.production()
    ? `file://${path.join( __dirname, 'dist/renderer/screens/firstrun/index.html' )}`
    : `http://localhost:${PORT}/screens/firstrun/index.html`,
  opts: {
    backgroundColor: '#f5f5f5', // "whitesmoke"
    width: WIDTH,
    height: HEIGHT,
    minWidth: WIDTH,
    minHeight: HEIGHT,
    maximizable: false,
    resizable: false,
    movable: false,
    minimizable: false,
  }
};


let screen: Screen;


/**
 * Utility functions
 */

function openMainWindow() {
  // wait a few seconds before opening the main window
  setTimeout( () => {
    ipcMain.emit( '/screens/main/intro-email' );
    ipcMain.emit( '/screens/main/open' );
    screen.handle.close();
  }, 2000 );
}


/**
 * World gen functions
 */

async function saveplayer( data: IterableObject<any>[] ) {
  const [ userinfo, teaminfo ] = data;

  // get the countryids
  const teamcountry = await Country.findOne({ where: { name: teaminfo.country }});
  const playercountry = await Country.findOne({ where: { name: userinfo.country }});

  // build team object
  const team = await Team.create({
    name: teaminfo.name,
    tier: 4,
  });

  // build player object
  const player = await Player.create({
    alias: userinfo.alias,
    tier: 4,
  });

  // create the new user profile
  const profile = await Profile.create();

  // save associations and return as a single promise
  return Promise.all([
    team.setCountry( teamcountry as Country ),
    player.setTeam( team ),
    player.setCountry( playercountry as Country ),
    profile.setTeam( team ),
    profile.setPlayer( player )
  ]);
}


async function assignManagers() {
  // get the user's team
  const profile = await Profile.findOne({ include: [{ all: true }] });
  const team = profile?.Team;

  // get all personas and group them by type/name
  const personas = await Persona.findAll({
    where: { teamId: null },
    include: [ 'PersonaType' ]
  });

  const managers = personas.filter( p => p.PersonaType?.name === 'Manager' );
  const asstmanagers = personas.filter( p => p.PersonaType?.name === 'Assistant Manager' );

  // pick a random manager+asst manager combo
  const randmanager = managers[ random( 0, managers.length - 1 ) ];
  const randasstmanager = asstmanagers[ random( 0, asstmanagers.length - 1 ) ];

  // set associations and send back as a promise
  return Promise.all([
    randmanager.setTeam( team ),
    randasstmanager.setTeam( team ),
  ]);
}


async function genSingleComp( compdef: Compdef ) {
  // get the regions
  const regionids = compdef.Continents?.map( c => c.id ) || [];
  const regions = await Continent.findAll({
    where: { id: regionids }
  });

  // bail if no regions
  if( !regions ) {
    return Promise.resolve();
  }

  return Promise.all( regions.map( async region => {
    const teams = await Team.findByRegionId( region.id );
    const leagueobj = new League( compdef.name );

    // add teams to the competition tiers
    compdef.tiers.forEach( ( tier, tdx ) => {
      const div = leagueobj.addDivision( tier.name, tier.minlen, tier.confsize );
      const tierteams = teams.filter( t => t.tier === tdx );
      div.addCompetitors( tierteams.slice( 0, tier.minlen ).map( t => t.id.toString() ) );
    });

    // build the competition
    const comp = Competition.build({ data: leagueobj });
    await comp.save();

    // save its associations
    return Promise.all([
      comp.setCompdef( compdef ),
      comp.setContinents([ region ]),
    ]);
  }));
}


async function genAllComps() {
  const compdefs = await Compdef.findAll({
    include: [ 'Continents' ],
  });
  return compdefs.map( genSingleComp );
}


/**
 * IPC Handlers
 */

async function saveFirstRunHandler( evt: object, data: IterableObject<any>[] ) {
  Promise.resolve( data )
    // save the player information
    .then( saveplayer )

    // assign a manager+astmanager to the new team
    .then( assignManagers )

    // generate the competitions
    .then( genAllComps )

    // finished!
    .then( openMainWindow )
  ;
}


function openWindowHandler() {
  screen = ScreenManager.createScreen(
    '/screens/firstrun',
    CONFIG.url,
    CONFIG.opts
  );
  screen.handle.setMenu( DefaultMenuTemplate );

  // the `setMenu` function above doesn't work on
  // osx so we'll have to accomodate for that
  if( is.osx() ) {
    Menu.setApplicationMenu( DefaultMenuTemplate );
  }
}


export default () => {
  // ipc listeners
  ipcMain.on( '/screens/firstrun/open', openWindowHandler );
  ipcMain.on( '/screens/firstrun/save', saveFirstRunHandler );
};
