import moment from 'moment';
import { random } from 'lodash';
import * as Sqrl from 'squirrelly';
import * as Models from 'main/database/models';
import { OfferRequest } from 'shared/types';
import { ActionQueueTypes, OfferStatus } from 'shared/enums';
import Application from 'main/constants/application';
import EmailDialogue from 'main/constants/emaildialogue';


// module-level private vars
let _profile: Models.Profile;
let _target: Models.Player | null;


/**
 * Handle offer responses from
 * team and/or the target
 */

async function teamRespondOffer( offerdetails: OfferRequest, response: string, reason: string ) {
  // bail if no data found
  if( !_profile.Player || !_target || !_target.Team ) {
    return Promise.reject();
  }

  // load the team's manager
  const persona = await Models.Persona.getManagerByTeamId( _target.Team.id );

  if( !persona ) {
    return Promise.reject();
  }

  // figure out when the team will send their response
  const daysoffset = random(
    Application.TEAM_OFFER_RESPONSE_MINDAYS,
    Application.TEAM_OFFER_RESPONSE_MAXDAYS
  );

  const targetdate = moment( _profile.currentDate ).add( daysoffset, 'days' );

  // record their response
  const transferoffer = await Models.TransferOffer.create({
    status: OfferStatus.PENDING,
    fee: offerdetails.fee,
    wages: offerdetails.wages,
    msg: reason,
  });

  await transferoffer.setTeam( _profile.Team );
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
  // bail if no data found
  if( !_profile.Player || !_profile.Team || !_target ) {
    return Promise.reject();
  }

  // load the team's manager
  const persona = await Models.Persona.getManagerByTeamId( _profile.Team.id, 'Assistant Manager' );

  if( !persona ) {
    return Promise.reject();
  }

  // figure out when to send the player's response which
  // can be affected if this player had a team
  const daysoffset = teamresponseoffset + random(
    Application.PLAYER_OFFER_RESPONSE_MINDAYS,
    Application.PLAYER_OFFER_RESPONSE_MAXDAYS
  );

  const targetdate = moment( _profile.currentDate ).add( daysoffset, 'days' );

  // record their response
  const transferoffer = await Models.TransferOffer.create({
    status: OfferStatus.PENDING,
    fee: offerdetails.fee,
    wages: offerdetails.wages,
    msg,
  });

  await transferoffer.setTeam( _profile.Team );
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
        content: Sqrl.render( msg, { player: _profile.Player }),
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
  _profile = await Models.Profile.getActiveProfile();
  _target = await Models.Player.findByPk( offerdetails.playerid, { include: [ 'Team' ] });

  if( !_target || !_profile.Player || !_profile.Team ) {
    return Promise.reject();
  }

  // team's response will offset the player's decision time
  let teamresponseoffset = 0;

  // check if team already accepted
  const teamaccepted = await Models.TransferOffer.count({
    where: {
      playerId: _target.id,
      status: OfferStatus.ACCEPTED
    }
  }) > 0;

  // -----------------------------------
  // first, the team will decide if they
  // want to accept the transfer offer
  // -----------------------------------

  if( !teamaccepted && _target.Team ) {

    // is the player transfer listed?
    if( offerdetails.fee && !_target.transferListed ) {
      return teamRespondOffer( offerdetails, OfferStatus.REJECTED, EmailDialogue.TEAM_REJECT_REASON_NOTFORSALE );
    }

    // does it match asking price?
    if( offerdetails.fee && offerdetails.fee < _target.transferValue ) {
      return teamRespondOffer( offerdetails, OfferStatus.REJECTED, EmailDialogue.TEAM_REJECT_REASON_FEE );
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
  if( _target.tier < _profile.Player.tier ) {
    return playerRespondOffer( offerdetails, OfferStatus.REJECTED, EmailDialogue.PLAYER_REJECT_REASON_TIER, teamresponseoffset );
  }

  // offer accepted — move the player to the user's team
  const responseoffset = await playerRespondOffer( offerdetails, OfferStatus.ACCEPTED, EmailDialogue.PLAYER_ACCEPT, teamresponseoffset );

  return Models.ActionQueue.create({
    type: ActionQueueTypes.TRANSFER_MOVE,
    actionDate: moment( _profile.currentDate ).add( responseoffset, 'days' ),
    payload: {
      teamid: _profile.Team.id,
      targetid: _target.id,
      wages: offerdetails.wages,
      fee: offerdetails.fee,
      tier: _profile.Team.tier,
    }
  });
}
