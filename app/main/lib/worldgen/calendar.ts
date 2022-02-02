import * as Sqrl from 'squirrelly';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';
import * as WGCompetition from './competition';
import * as Worldgen from './worldgen';
import * as Offer from './offer';
import moment from 'moment';
import ItemLoop from 'main/lib/item-loop';
import ScreenManager from 'main/lib/screen-manager';
import Application from 'main/constants/application';
import EmailDialogue from 'main/constants/emaildialogue';
import { flatten } from 'lodash';
import { ActionQueueTypes, CompTypes } from 'shared/enums';
import { Cup, League } from 'main/lib/league';
import { parseCompType, sendEmailAndEmit } from 'main/lib/util';

/**
 * Helper functions
 */

async function bumpDate() {
  const profile = await Models.Profile.getActiveProfile();
  const today = moment( profile.currentDate );
  profile.currentDate = today.add( 1, 'day' ).toDate();
  return profile.save();
}


// ---------------------------
// ITEM LOOP MODULE MIDDLEWARE
// ---------------------------

const itemloop = new ItemLoop.ItemLoop();


/**
 * Runs at the beginning and end of every tick.
 */

// gets the items we'll be iterating thru
itemloop.register( ItemLoop.MiddlewareType.INIT, async () => {
  const profile = await Models.Profile.getActiveProfile();
  const queue = await Models.ActionQueue.findAll({
    where: { actionDate: profile.currentDate, completed: false },
    order: [
      [ 'type', 'DESC' ]
    ]
  });
  return Promise.resolve( queue );
});


// record matchday results
itemloop.register( ItemLoop.MiddlewareType.END, async () => {
  // if this returned true, new matches were generated
  // we must let the UI know it's time to fetch a new
  // batch of upcoming matches
  const res = await WGCompetition.recordTodaysMatchResults();

  if( res ) {
    ScreenManager
      .getScreenById( IPCRouting.Main._ID )
      .handle
      .webContents
      .send( IPCRouting.Competition.MATCHES_NEW )
    ;
  }

  return Promise.resolve();
});


// bumps the current date
itemloop.register( ItemLoop.MiddlewareType.END, () => {
  return bumpDate();
});


// send a transfer offer to user?
itemloop.register( ItemLoop.MiddlewareType.END, () => {
  return Offer.generate();
});


/**
 * runs after all items in the tick are executed.
 * this can be declared several times.
 */

// marks the items as completed and lets the
// front-end know this iteration is done
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


/**
 * the types of jobs that can run on every tick
 */

itemloop.register( ActionQueueTypes.ENDSEASON_PRIZE_MONEY, async () => {
  const allcompetitions = await Models.Competition.findAll({ include: [ 'Comptype', 'Compdef' ] });
  const competitions = allcompetitions.filter( c => c.season === c.Compdef.season );

  // grab the competition winners
  const all_winners = flatten( competitions.map( competition => {
    const [ isleague, iscup, ischampionsleague ] = parseCompType( competition.Comptype.name );
    const prizepool_config = competition.Compdef.prizePool;
    const winners: any[] = [];

    if( iscup ) {
      const cupobj = Cup.restore( competition.data );
      const [ champion, runner_up, ...ro16 ] =  cupobj.duelObj.results();
      const prizemoney_champion = Math.floor( prizepool_config.total * ( prizepool_config.distribution[ 0 ] / 100 ) );
      const prizemoney_runner_up = Math.floor( prizepool_config.total * ( prizepool_config.distribution[ 1 ] / 100 ) );
      const prizemoney_top_four = Math.floor( prizepool_config.total * ( prizepool_config.distribution[ 2 ] / 100 ) );
      const prizemoney_top_eight = Math.floor( prizepool_config.total * ( prizepool_config.distribution[ 3 ] / 100 ) );
      const prizemoney_top_sixteen = Math.floor( prizepool_config.total * ( prizepool_config.distribution[ 4 ] / 100 ) );
      winners.push([ cupobj.getCompetitorBySeed( champion.seed ).id, prizemoney_champion ]);
      winners.push([ cupobj.getCompetitorBySeed( runner_up.seed ).id, prizemoney_runner_up ]);
      ro16.slice( 2, 4 ).forEach( item => winners.push([ cupobj.getCompetitorBySeed( item.seed ).id, prizemoney_top_four ]));
      ro16.slice( 4, 8 ).forEach( item => winners.push([ cupobj.getCompetitorBySeed( item.seed ).id, prizemoney_top_eight ]));
      ro16.slice( 8, 16 ).forEach( item => winners.push([ cupobj.getCompetitorBySeed( item.seed ).id, prizemoney_top_sixteen ]));
    }

    if( isleague && !ischampionsleague ) {
      const leagueobj = League.restore( competition.data );
      const conf_distribution = [ 75, 20, 5 ];
      leagueobj.divisions.forEach( ( division, tierid ) => {
        const prizepool_amount = prizepool_config.total * ( prizepool_config.distribution[ tierid ] / 100 );
        const prizepool_per_conference = Math.floor( prizepool_amount / division.conferences.length );

        // split conference prize pool up between the regular season and playoff winners
        const prizemoney_champions = Math.floor( prizepool_per_conference * ( conf_distribution[ 0 ] / 100 ) );
        const prizemoney_runners_up = Math.floor( prizepool_per_conference * ( conf_distribution[ 1 ] / 100 ) );
        const prizemoney_promotion_winners = Math.floor( prizepool_per_conference * ( conf_distribution[ 2 ] / 100 ) );
        division.conferenceWinners.filter( ( c, idx ) => idx % 2 === 0 ).forEach( c => winners.push([ c.id, prizemoney_champions ]));
        division.conferenceWinners.filter( ( c, idx ) => idx % 2 !== 0 ).forEach( c => winners.push([ c.id, prizemoney_runners_up ]));
        division.promotionWinners.forEach( competitor => winners.push([ competitor.id, prizemoney_promotion_winners ]));
      });
    }

    return winners;
  }));

  return Promise.all( all_winners.filter( item => item.length > 0 ).map( async winner => {
    const [ winner_id, winner_amt ] = winner;
    const team = await Models.Team.findByPk( winner_id );
    return team.increment( 'earnings', { by: winner_amt } );
  }));
});


itemloop.register( ActionQueueTypes.ENDSEASON_REPORT, async () => {
  // grab the league the user is in
  // grab their position (based off of idx)
  // did they move up?
  // did they move down?
  //
  // grab the cup the user is in
  // did they make it far?
  const profile = await Models.Profile.getActiveProfile();
  const competitions = await Models.Competition.findAllByTeam( profile.Team.id );
  const persona = await Models.Persona.findOne({
    where: { teamId: profile.Team.id },
    include: [{
      model: Models.PersonaType,
      where: { name: 'Assistant Manager' }
    }]
  });
  const baseemail = {
    from: persona,
    to: profile.Player,
    sentAt: profile.currentDate
  };
  const [ compobj ] = competitions.filter( c => c.season === c.Compdef.season && c.Comptype.name === CompTypes.LEAGUE );

  if( compobj ) {
    const leagueobj = League.restore( compobj.data );
    const divobj = leagueobj.getDivisionByCompetitorId( profile.Team.id );
    const [ conf, seed ] = divobj.getCompetitorConferenceAndSeedNumById( profile.Team.id );
    const results = conf.groupObj.results();
    const pos = results.findIndex( r => r.seed === seed ) + 1;    // 17

    // @todo: store these in the shared folder
    const PROMOTION_AUTO      = 2;
    const PROMOTION_PLAYOFFS  = 6;
    const RELEGATION          = 18;
    const WINNERS_BRACKET     = 1;

    if( pos <= PROMOTION_AUTO ) {
      // automatic move-up
      await sendEmailAndEmit({
        ...baseemail,
        subject: 'Moving on up!',
        content: Sqrl.render( EmailDialogue.ENDSEASON_PROMOTION_AUTO, { player: profile.Player }),
      });
    }

    if( pos > PROMOTION_AUTO && pos <= PROMOTION_PLAYOFFS ) {
      // promotional playoffs. did they win?
      const [ pconf, pseed ] = divobj.getCompetitorPromotionConferenceAndSeedNumById( profile.Team.id );
      const match = pconf.duelObj.findMatch({ s: WINNERS_BRACKET, r: pconf.duelObj.p, m: 1 });

      if( match.p.includes( pseed ) ) {
        await sendEmailAndEmit({
          ...baseemail,
          subject: 'Moving on up!',
          content: Sqrl.render( EmailDialogue.ENDSEASON_PROMOTION_PLAYOFFS, { player: profile.Player }),
        });
      }
    }

    if( pos >= RELEGATION ) {
      // :( relegated (if not bottom division)
      await sendEmailAndEmit({
        ...baseemail,
        subject: 'Whoops.',
        content: Sqrl.render( EmailDialogue.ENDSEASON_RELEGATION, { player: profile.Player }),
      });
    }
  }

  return Promise.resolve();
});


itemloop.register( ActionQueueTypes.MATCHDAY, () => {
  return Promise.resolve( false );
});


itemloop.register( ActionQueueTypes.MATCHDAY_NPC, async item => {
  return WGCompetition.simNPCMatchday( item );
});


itemloop.register( ActionQueueTypes.SEND_EMAIL, async item => {
  await sendEmailAndEmit( item.payload );
  return Promise.resolve( false );
});


itemloop.register( ActionQueueTypes.START_COMP, async item => {
  return Models.Competition
    .findByPk( item.payload, { include: [ 'Comptype', 'Compdef', 'Continent' ] })
    .then( WGCompetition.start )
    .then( WGCompetition.genMatchdays )
  ;
});


itemloop.register( ActionQueueTypes.START_SEASON, () => {
  return Promise.resolve()
    .then( Worldgen.trimActionQueue )
    .then( WGCompetition.nextSeasonStartDate )
    .then( Worldgen.schedulePrizeMoneyDistribution )
    .then( Worldgen.scheduleEndSeasonReport )
    .then( WGCompetition.bumpSeasonNumbers )
    .then( WGCompetition.syncTiers )
    .then( WGCompetition.genAllComps )
    .then( WGCompetition.assignUserCompetitions )
  ;
});


itemloop.register( ActionQueueTypes.TRANSFER_MOVE, async item => {
  // update the player's team
  const player = await Models.Player.findByPk( item.payload.targetid );

  await Promise.all([
    player?.update({
      monthlyWages: item.payload.wages,
      transferValue: item.payload.fee,
      transferListed: false,
      tier: item.payload.tier,
      eligibleDate: item.payload.eligible,
    }),
    player?.setTeam( item.payload.teamid )
  ]);

  // if the user was selling, add the
  // transfer fee to their earnings
  const profile = await Models.Profile.getActiveProfile();

  if( item.payload.is_selling && item.payload.fee > 0 ) {
    return profile.Team.increment( 'earnings', { by: item.payload.fee } );
  } else {
    return Promise.resolve();
  }
});


itemloop.register( ActionQueueTypes.TRANSFER_OFFER_RESPONSE, async item => {
  return Models.TransferOffer.update(
    { status: item.payload.status, msg: item.payload.msg },
    { where: { id: item.payload.id } }
  );
});


/**
 * Main function
 *
 * Queries actionqueue items for today's date
 * and executes those action items.
 */

export function loop_stop() {
  itemloop.stop();
}


export function loop( max = Application.CALENDAR_LOOP_MAX_ITERATIONS ) {
  return itemloop.start( max );
}
