import moment from 'moment';
import * as Sqrl from 'squirrelly';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';
import * as WGCompetition from './competition';
import { ActionQueueTypes } from 'shared/enums';
import { League } from 'main/lib/league';
import ItemLoop from 'main/lib/item-loop';
import ScreenManager from 'main/lib/screen-manager';
import Application from 'main/constants/application';
import EmailDialogue from 'main/constants/emaildialogue';


/**
 * Helper functions
 */

async function bumpDate() {
  const profile = await Models.Profile.getActiveProfile();
  const today = moment( profile.currentDate );
  profile.currentDate = today.add( 1, 'day' ).toDate();
  return profile.save();
}


/**
 * Set up the item loop module
 */

const itemloop = new ItemLoop.ItemLoop();


// runs once at the start and end of every tick
itemloop.register( ItemLoop.MiddlewareType.INIT, async () => {
  const profile = await Models.Profile.getActiveProfile();
  const queue = await Models.ActionQueue.findAll({
    where: { actionDate: profile.currentDate, completed: false }
  });

  return Promise.resolve( queue );
});


itemloop.register( ItemLoop.MiddlewareType.END, () => {
  // bump the current date
  return bumpDate();
});


// runs after all items in the tick are executed
itemloop.register( null, async () => {
  const profile = await Models.Profile.getActiveProfile();
  const today = moment( profile.currentDate );
  const tomorrow = today.add( 1, 'day' );

  // are we in pre-season?
  const preseason_start = moment([ today.year(), Application.PRESEASON_START_MONTH, Application.PRESEASON_START_DAY ]);
  const preseason_end = preseason_start.add( Application.PRESEASON_LENGTH, 'days' );
  const preseason_days_left = preseason_end.diff( today, 'days' );
  const preseason = today.isBefore( preseason_end );

  // if we are in pre-season do we need to send an
  // e-mail in case the user does not have a squad?
  const squad_deadline = Application.PRESEASON_SQUAD_DEADLINE_DAYS.includes( preseason_days_left );

  if( preseason && squad_deadline && profile.Team.Players.length < 5 ) {
    const persona = await Models.Persona.getManagerByTeamId( profile.Team.id, 'Assistant Manager' );
    await Models.ActionQueue.create({
      type: ActionQueueTypes.SEND_EMAIL,
      actionDate: tomorrow,
      payload: {
        from: persona.id,
        to: profile.Player.id,
        subject: 'Concerned about our squad',
        content: Sqrl.render( EmailDialogue.PRESEASON_SQUAD_DEADLINE, { player: profile.Player }),
        sentAt: tomorrow,
      }
    });
  }

  return Promise.resolve();
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

  return Promise.resolve();
});


// the types of jobs that can run on every tick
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
    .then( WGCompetition.start )
    .then( WGCompetition.genMatchdays )
  ;
});


itemloop.register( ActionQueueTypes.MATCHDAY, () => {
  return Promise.resolve( false );
});


itemloop.register( ActionQueueTypes.MATCHDAY_NPC, async item => {
  const compobj = await Models.Competition.findByPk( item.payload.compId );
  const leagueobj = League.restore( compobj.data );
  const divobj = leagueobj.divisions.find( d => d.name === item.payload.divId );
  const conf = divobj.conferences.find( c => c.id === item.payload.confId );
  conf.groupObj.score( item.payload.matchId, [ 10, 0 ]);
  compobj.data = leagueobj;
  return compobj.save();
});


/**
 * Main function
 *
 * Queries actionqueue items for today's date
 * and executes those action items.
 */

export function loop( max = Application.CALENDAR_LOOP_MAX_ITERATIONS ) {
  return itemloop.start( max );
}
