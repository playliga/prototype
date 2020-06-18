import moment from 'moment';
import { random } from 'lodash';
import * as Sqrl from 'squirrelly';
import { OfferRequest } from 'shared/types';
import { ActionQueueTypes, OfferStatus } from 'shared/enums';
import Application from 'main/constants/application';
import EmailDialogue from 'main/constants/emaildialogue';
import * as Models from 'main/database/models';


// module-level private vars
let _profile: Models.Profile;
let _target: Models.Player | null;


/**
 * Handle offer rejections from
 * team and/or the target
 */

async function teamRejectOffer( offerdetails: OfferRequest, reason: string ) {
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
  return Promise.all([
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
        status: OfferStatus.REJECTED,
        msg: reason
      }
    })
  ]);
}


async function playerRejectOffer( offerdetails: OfferRequest, reason: string ) {
  // bail if no data found
  if( !_profile.Player || !_profile.Team || !_target ) {
    return Promise.reject();
  }

  // load the team's manager
  const persona = await Models.Persona.getManagerByTeamId( _profile.Team.id, 'Assistant Manager' );

  if( !persona ) {
    return Promise.reject();
  }

  return Promise.all([
    Models.ActionQueue.create({
      type: ActionQueueTypes.SEND_EMAIL,
      actionDate: new Date(),
      payload: {
        from: persona.id,
        to: _profile.Player.id,
        subject: `re: Transfer offer for ${_target.alias}`,
        content: Sqrl.render( reason, { player: _profile.Player })
      }
    }),
  ]);
}


/**
 * Parse the offer that the user
 * has sent to the target player
 */

export async function parse( offerdetails: OfferRequest ) {
  // load related data
  _profile = await Models.Profile.getActiveProfile();
  _target = await Models.Player.findByPk( offerdetails.playerid, { include: [ 'Team' ] });

  if( !_target || !_profile.Player ) {
    return Promise.reject();
  }

  // -----------------------------------
  // first, the team will decide if they
  // want to accept the transfer offer
  // -----------------------------------

  // is the player transfer listed?
  if( _target.Team && offerdetails.fee && !_target.transferListed ) {
    return teamRejectOffer( offerdetails, EmailDialogue.TEAM_REJECT_REASON_NOTFORSALE );
  }

  // does it match asking price?
  if( _target.Team && offerdetails.fee && offerdetails.fee < _target.transferValue ) {
    return teamRejectOffer( offerdetails, EmailDialogue.TEAM_REJECT_REASON_FEE );
  }

  // -----------------------------------
  // the team is good with the offer. now
  // it's up to the player to decide
  // -----------------------------------

  // does it match their current wages?
  if( offerdetails.wages <= _target.monthlyWages ) {
    return playerRejectOffer( offerdetails, '' );
  }

  // does it match their tier?
  if( _target.tier > _profile.Player.tier ) {
    return playerRejectOffer( offerdetails, '' );
  }

  return Promise.resolve();
}
