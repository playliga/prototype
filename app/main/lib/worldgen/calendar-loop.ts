import moment from 'moment';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';
import { random } from 'lodash';
import { ActionQueueTypes, CompTypes } from 'shared/enums';
import { League } from 'main/lib/league';
import ItemLoop from 'main/lib/item-loop';
import ScreenManager from 'main/lib/screen-manager';
import Application from 'main/constants/application';


/**
 * Set up the item loop module
 */

const itemloop = new ItemLoop.ItemLoop();


itemloop.register( ItemLoop.MiddlewareType.INIT, async () => {
  const profile = await Models.Profile.getActiveProfile();
  const queue = await Models.ActionQueue.findAll({
    where: { actionDate: profile.currentDate, completed: false }
  });

  return Promise.resolve( queue );
});


itemloop.register( ItemLoop.MiddlewareType.END, async () => {
  const profile = await Models.Profile.getActiveProfile();
  profile.currentDate = moment( profile.currentDate )
    .add( 1, 'day' )
    .toDate()
  ;
  await profile.save();
});


itemloop.register( null, async ( items: Models.ActionQueue[] ) => {
  // update the completed items
  await Promise.all( items.map( i => i.update({ completed: true }) ) );

  // fetch a fresh profile in case of transfer moves
  const profile = await Models.Profile.getActiveProfile();

  // send the updated profile to the renderer
  ScreenManager
    .getScreenById( IPCRouting.Main._ID )
    .handle
    .webContents
    .send(
      IPCRouting.Database.PROFILE_GET,
      JSON.stringify( profile )
    )
  ;
});


itemloop.register( ActionQueueTypes.SEND_EMAIL, async item => {
  const email = await Models.Email.send( item.payload );

  ScreenManager
    .getScreenById( IPCRouting.Main._ID )
    .handle
    .webContents
    .send(
      IPCRouting.Worldgen.EMAIL_NEW,
      JSON.stringify( email )
    )
  ;

  return Promise.resolve( false );
});


itemloop.register( ActionQueueTypes.TRANSFER_OFFER_RESPONSE, async item => {
  return Models.TransferOffer.update(
    { status: item.payload.status, msg: item.payload.msg },
    { where: { id: item.payload.id } }
  );
});


itemloop.register( ActionQueueTypes.TRANSFER_MOVE, async item => {
  return Models.Player
    .findByPk( item.payload.targetid )
    .then( player => Promise.all([
      player?.update({
        monthlyWages: item.payload.wages,
        transferValue: item.payload.fee,
        transferListed: false,
        tier: item.payload.tier,
        eligibleDate: item.payload.eligible,
      }),
      player?.setTeam( item.payload.teamid )
    ]))
  ;
});


itemloop.register( ActionQueueTypes.START_COMP, async item => {
  return Models.Competition
    .findByPk( item.payload, { include: [ 'Comptype' ] })
    .then( startCompetition )
    .then( generateMatchdays )
  ;
});


/**
 * Start competitions and generate their matchdays
 */

function startCompetition( comp: Models.Competition ) {
  const league = League.restore( comp.data );
  league.start();
  return comp.update({ data: league });
}


function getMatchdayWeekday( type: string, date: moment.Moment ) {
  switch( type ) {
    case CompTypes.LEAGUE: {
      const day = random( 0, Application.MATCHDAYS_LEAGUE.length - 1 );
      return date.weekday( Application.MATCHDAYS_LEAGUE[ day ] );
    }
    default:
      return;
  }
}


async function generateMatchdays( comp: Models.Competition ) {
  // get user's profile
  const profile = await Models.Profile.getActiveProfile();

  // bail if the user's team is not competing in this competition
  const joined = profile
    .Team
    .Competitions
    .findIndex( c => c.id === comp.id )
  > -1;

  if( !joined ) {
    return Promise.resolve();
  }

  // get their team's division, conference, and seednum
  const leagueobj = League.restore( comp.data );
  const divobj = leagueobj.getDivisionByCompetitorId( profile.Team.id );
  const [ conf, seednum ] = divobj.getCompetitorConferenceAndSeedNumById( profile.Team.id );
  const matches = conf.groupObj.upcoming( seednum );

  // generate their matchdays which tie into the actionqueue db table
  const matchdays = matches.map( ( match, idx ) => ({
    type: ActionQueueTypes.MATCHDAY,
    actionDate: getMatchdayWeekday(
      comp.Comptype.name,
      moment( profile.currentDate ).add( idx + 1, 'weeks' )
    ),
    payload: {
      compId: comp.id,
      confId: conf.id,
      divId: divobj.name,
      matchId: match.id,
    }
  }));

  // bulk insert into the actionqueue as matchdays
  return Models.ActionQueue.bulkCreate( matchdays );
}


/**
 * Calendar loop
 *
 * query action queue items for today's date
 * and execute those action items.
 */

export function start() {
  return itemloop.start( Application.CALENDAR_LOOP_MAX_ITERATIONS );
}
