import moment from 'moment';
import probable from 'probable';
import log from 'electron-log';
import { random } from 'lodash';
import { Op, Sequelize } from 'sequelize';
import * as Sqrl from 'squirrelly';
import * as Models from 'main/database/models';
import { OfferRequest } from 'shared/types';
import { ActionQueueTypes, OfferStatus } from 'shared/enums';
import Application from 'main/constants/application';
import EmailDialogue from 'main/constants/emaildialogue';


// module-level private vars
let _profile: Models.Profile;
let _target: Models.Player | null;


// how likely is the target to move to a different region
const TARGET_REGION_PROBABILITY_YES   = 10;
const TARGET_REGION_PROBABILITY_NO    = 90;

const targetRegionProbabilityTable = probable.createTableFromSizes([
  [ TARGET_REGION_PROBABILITY_YES, true ],
  [ TARGET_REGION_PROBABILITY_NO, false ]
]);


// how likely is the team willing to sell
// their non-transfer-listed player
const TEAM_UNLISTED_PROBABILITY_YES = 10;
const TEAM_UNLISTED_PROBABILITY_NO  = 90;

const teamUnlistedProbabilityTable = probable.createTableFromSizes([
  [ TEAM_UNLISTED_PROBABILITY_YES, true ],
  [ TEAM_UNLISTED_PROBABILITY_NO, false ]
]);


// how likely is the team willing to buy
// the player for the adjusted fee?
const TEAM_ADJUSTED_FEE_YES = 20;
const TEAM_ADJUSTED_FEE_NO = 80;

const teamAdjustedFeeProbabilityTable = probable.createTableFromSizes([
  [ TEAM_ADJUSTED_FEE_YES, true ],
  [ TEAM_ADJUSTED_FEE_NO, false ],
]);


/**
 * Handle offer responses from
 * team and/or the target
 */

async function teamRespondOffer( offerdetails: OfferRequest, response: string, reason: string, existingoffer: Models.TransferOffer = null ) {
  // load the team's manager
  const persona = await Models.Persona.getManagerByTeamId( _target.Team.id );

  if( !persona ) {
    return Promise.reject();
  }

  // figure out when the team will send their response
  const daysoffset = random(
    Application.OFFER_TEAM_RESPONSE_MINDAYS,
    Application.OFFER_TEAM_RESPONSE_MAXDAYS
  );

  const targetdate = moment( _profile.currentDate ).add( daysoffset, 'days' );

  // record their response
  let transferoffer = existingoffer;

  if( !existingoffer ) {
    transferoffer = await Models.TransferOffer.create({
      status: OfferStatus.PENDING,
      fee: offerdetails.fee,
      wages: offerdetails.wages,
      msg: reason,
    });

    await transferoffer.setTeam( _profile.Team );
    await transferoffer.setPlayer( _target );
  }

  // add it to the queue
  await Promise.all([
    Models.ActionQueue.create({
      type: ActionQueueTypes.SEND_EMAIL,
      actionDate: targetdate,
      payload: {
        from: persona.id,
        to: _profile.Player.id,
        subject: `re: Transfer offer for ${_target.alias}`,
        content: Sqrl.render( reason, { player: _profile.Player }),
        sentAt: targetdate,
      }
    }),
    Models.ActionQueue.create({
      type: ActionQueueTypes.TRANSFER_OFFER_RESPONSE,
      actionDate: targetdate,
      payload: {
        id: transferoffer.id,
        status: response,
        msg: reason
      }
    })
  ]);

  return Promise.resolve( daysoffset );
}


async function playerRespondOffer(
  offerdetails: OfferRequest,
  status: string,
  msg: string,
  teamresponseoffset = 0
) {
  // load the team's manager
  const persona = await Models.Persona.getManagerByTeamId( _profile.Team.id, 'Assistant Manager' );

  if( !persona ) {
    return Promise.reject();
  }

  // figure out when to send the player's response which
  // can be affected if this player had a team
  const daysoffset = teamresponseoffset + random(
    Application.OFFER_PLAYER_RESPONSE_MINDAYS,
    Application.OFFER_PLAYER_RESPONSE_MAXDAYS
  );

  const targetdate = moment( _profile.currentDate ).add( daysoffset, 'days' );

  // record their response
  const transferoffer = await Models.TransferOffer.create({
    status: OfferStatus.PENDING,
    fee: offerdetails.fee,
    wages: offerdetails.wages,
    msg,
  });

  await transferoffer.setTeam( offerdetails.teamdata?.id || _profile.Team );
  await transferoffer.setPlayer( _target );

  // add it to the queue
  await Promise.all([
    Models.ActionQueue.create({
      type: ActionQueueTypes.SEND_EMAIL,
      actionDate: targetdate,
      payload: {
        from: persona.id,
        to: _profile.Player.id,
        subject: `re: Transfer offer for ${_target.alias}`,
        content: Sqrl.render( msg, {
          player: _profile.Player,
          team: offerdetails.teamdata,
        }),
        sentAt: targetdate,
      }
    }),
    Models.ActionQueue.create({
      type: ActionQueueTypes.TRANSFER_OFFER_RESPONSE,
      actionDate: targetdate,
      payload: {
        id: transferoffer.id,
        status,
        msg
      }
    })
  ]);

  return Promise.resolve( daysoffset );
}


/**
 * Parse the offer that the user
 * has sent to the target player
 */

export async function parse( offerdetails: OfferRequest ) {
  // load related data
  const region_query = {
    model: Models.Country,
    include: [ Models.Continent ]
  };
  _profile = await Models.Profile.getActiveProfile();
  _target = await Models.Player.findByPk( offerdetails.playerid, { include: [
    { ...region_query },
    {
      model: Models.Team,
      include: [
        { model: Models.Player },
        { ...region_query },
      ]
    }
  ]});

  // team's response will offset the player's decision time
  let teamresponseoffset = 0;

  // check if team already accepted
  const teamaccepted = await Models.TransferOffer.count({
    where: {
      playerId: _target.id,
      status: OfferStatus.ACCEPTED
    }
  }) > 0;

  // check the status of the most recent offer
  const recentoffer = await Models.TransferOffer.findOne({
    where: { playerId: _target.id },
    order: [ [ 'id', 'DESC' ] ],
  });

  // is the user selling their player?
  const selling = (
    recentoffer
    && recentoffer.status === OfferStatus.PENDING
    && ( offerdetails.fee && recentoffer.fee !== offerdetails.fee )
  );

  // -----------------------------------
  // first, the team will decide if they
  // want to accept the transfer offer
  // -----------------------------------

  // is this in response to a price adjustment? then they already want the
  // player and are simply deciding on whether the new fee is good.
  if( selling ) {
    // is the team willing to pay the new fee?
    if( !teamAdjustedFeeProbabilityTable.roll() ) {
      return teamRespondOffer( offerdetails, OfferStatus.REJECTED, EmailDialogue.TEAM_REJECT_REASON_ADJUSTED_FEE, recentoffer );
    }

    // offer accepted — offset the player's response time
    // with however long the team took to respond
    teamresponseoffset = await teamRespondOffer( offerdetails, OfferStatus.ACCEPTED, EmailDialogue.TEAM_ACCEPT, recentoffer );
  } else if( !teamaccepted && _target.Team ) {
    // is the player transfer listed? if not, the team will
    // consider selling but the chances are not high
    if( !_target.transferListed && !teamUnlistedProbabilityTable.roll() ) {
      return teamRespondOffer( offerdetails, OfferStatus.REJECTED, EmailDialogue.TEAM_REJECT_REASON_NOTFORSALE );
    }

    // does it match asking price?
    if( offerdetails.fee && offerdetails.fee < _target.transferValue ) {
      return teamRespondOffer( offerdetails, OfferStatus.REJECTED, EmailDialogue.TEAM_REJECT_REASON_FEE );
    }

    // can they afford to sell the player?
    if( _target.Team.Players.length <= Application.SQUAD_MIN_LENGTH ) {
      return teamRespondOffer( offerdetails, OfferStatus.REJECTED, EmailDialogue.TEAM_REJECT_REASON_SQUAD_DEPTH );
    }

    // offer accepted — offset the player's response time
    // with however long the team took to respond
    teamresponseoffset = await teamRespondOffer( offerdetails, OfferStatus.ACCEPTED, EmailDialogue.TEAM_ACCEPT );
  }

  // -----------------------------------
  // the team is good with the offer. now
  // it's up to the player to decide
  // -----------------------------------

  // does it match their current wages?
  if( _target.monthlyWages > 0 && offerdetails.wages <= _target.monthlyWages ) {
    return playerRespondOffer( offerdetails, OfferStatus.REJECTED, EmailDialogue.PLAYER_REJECT_REASON_WAGES, teamresponseoffset );
  }

  // does it match their tier?
  //
  // @note: lower tiers have higher numbers. e.g.:
  // @note: Open      — 4
  // @note: Advanced  — 1
  if( _target.tier < ( offerdetails.teamdata?.tier || _profile.Team.tier ) ) {
    return playerRespondOffer( offerdetails, OfferStatus.REJECTED, EmailDialogue.PLAYER_REJECT_REASON_TIER, teamresponseoffset );
  }

  // not in their region but the tier is higher. player will consider it...
  // a false roll means the player decided on staying in their own region.
  if(
    ( ( _target.Team && _target.Team.Country.Continent.id !== _profile.Team.Country.Continent.id ) || _target.Country.Continent.id !== _profile.Team.Country.Continent.id )
    && !targetRegionProbabilityTable.roll()
  ) {
    return playerRespondOffer( offerdetails, OfferStatus.REJECTED, EmailDialogue.PLAYER_REJECT_REASON_REGION, teamresponseoffset );
  }

  // offer accepted — move the player to the target team
  const responseoffset = await playerRespondOffer( offerdetails, OfferStatus.ACCEPTED, EmailDialogue.PLAYER_ACCEPT, teamresponseoffset );
  const actiondate = moment( _profile.currentDate ).add( responseoffset, 'days' );

  // add the transfer buffer time — this is the time one must
  // wait before negotiating wages with the player again
  const eligibledate = moment( actiondate ).add( Application.OFFER_PLAYER_ELIGIBLE_BUFFER_DAYS, 'days' );

  return Models.ActionQueue.create({
    type: ActionQueueTypes.TRANSFER_MOVE,
    actionDate: actiondate,
    payload: {
      teamid: offerdetails.teamdata?.id || _profile.Team.id,
      targetid: _target.id,
      wages: offerdetails.wages,
      fee: offerdetails.fee,
      tier: offerdetails.teamdata?.tier || _profile.Team.tier,
      eligible: eligibledate,
      is_selling: selling,
    }
  });
}


/**
 * Send an offer to the user
 */

export async function generate() {
  const profile = await Models.Profile.getActiveProfile();

  // bail early if the user does not meet the minimum squad depth
  if( profile.Team.Players.length < Application.SQUAD_MIN_LENGTH ) {
    return Promise.resolve();
  }

  // send an offer to the user today?
  const firstOfferCheck = probable.createTableFromSizes([
    [ Application.OFFER_USER_BASE_PROBABILITY, true ],
    [ 100 - Application.OFFER_USER_BASE_PROBABILITY, false ],
  ]);

  if( !firstOfferCheck.roll() ) {
    return Promise.resolve();
  }

  // this will keep track of the final probability
  // value to send this dude an offer
  let send_offer_probability = Application.OFFER_USER_BASE_PROBABILITY;

  // is anybody transfer listed?
  let selectionpool = profile.Team.Players.filter( player => player.alias !== profile.Player.alias );
  const forsale = selectionpool.filter( player => player.transferListed );

  if( forsale.length > 0 ) {
    selectionpool = forsale;
    send_offer_probability += Application.OFFER_USER_SELLING_MODIFIER;
  }

  // pick a random player from the user's squad
  let target = selectionpool[ random( selectionpool.length - 1 ) ];

  // are we aiming for the top talent instead?
  const topTalentProbabilityTable = probable.createTableFromSizes([
    [ Application.OFFER_USER_TOP_TALENT_MODIFIER, true ],
    [ 100 - Application.OFFER_USER_TOP_TALENT_MODIFIER, false ],
  ]);

  if( topTalentProbabilityTable.roll() ) {
    log.info( 'CHOOSING TOP TALENT INSTEAD OF ' + target.alias );
    [ target ] = selectionpool.sort( ( a, b ) => a.tier - b.tier );
    log.info( 'CHOSE: ' + target.alias );
  }

  // randomly pick a team to make the offer.
  const team = await Models.Team.findOne({
    where: {
      tier: {[ Op.lte ]: target.tier },
      id: {[ Op.ne ]: profile.Team.id },
    },
    order: Sequelize.fn( 'RANDOM' ),
  });
  log.info( team.name + ' WILL BE SENDING THE OFFER' );

  // is our target a higher tier than us?
  if( target.tier > team.tier ) {
    send_offer_probability += Application.OFFER_USER_HIGH_TIER_MODIFIER;
  } else {
    send_offer_probability += Application.OFFER_USER_SAME_TIER_MODIFIER;
  }

  // is this player worth sending an offer to?
  const sendOfferProbabilityTable = probable.createTableFromSizes([
    [ send_offer_probability, true ],
    [ 100 - send_offer_probability, false ],
  ]);

  log.info( 'FINAL OFFER PROBABILITY VALUE: ' + send_offer_probability );
  if( !sendOfferProbabilityTable.roll() ) {
    log.info( 'DECIDED TO NOT SEND AN OFFER.' );
    return Promise.resolve();
  }

  // send an e-mail
  const persona = await Models.Persona.getManagerByTeamId( profile.Team.id, 'Assistant Manager' );
  const targetdate = moment( profile.currentDate ).add( Application.OFFER_TEAM_RESPONSE_MINDAYS, 'days' );

  await Models.ActionQueue.create({
    type: ActionQueueTypes.SEND_EMAIL,
    actionDate: targetdate,
    payload: {
      from: persona.id,
      to: profile.Player.id,
      subject: `Transfer offer for ${target.alias}`,
      content: Sqrl.render( EmailDialogue.OFFER_SENT, { player: profile.Player, target: target, team }),
      sentAt: targetdate,
    }
  });

  // send the offer
  log.info( 'SENDING AN OFFER TO ' + target.alias );
  const transferoffer = await Models.TransferOffer.create({
    status: OfferStatus.PENDING,
    fee: target.transferValue,
    wages: target.monthlyWages,
    msg: EmailDialogue.OFFER_SENT,
  });

  return Promise.all([
    transferoffer.setTeam( team ),
    transferoffer.setPlayer( target )
  ]);
}
