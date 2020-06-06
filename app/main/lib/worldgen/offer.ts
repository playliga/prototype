import { OfferRequest } from 'shared/types';
import { ActionQueueTypes } from 'shared/enums';
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

  return Promise.all([
    Models.ActionQueue.create({
      type: ActionQueueTypes.SEND_EMAIL,
      action_date: new Date(),
      payload: {
        from: persona.id,
        to: _profile.Player.id,
        subject: `re: Transfer offer for ${_target.alias}`,
        content: `
          Hi, ${_profile.Player.alias}.

          ${reason}
        `
      }
    }),
    Models.ActionQueue.create({
      type: ActionQueueTypes.TRANSFER_OFFER_RESPONSE,
      action_date: new Date(),
      payload: offerdetails
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
      action_date: new Date(),
      payload: {
        from: persona.id,
        to: _profile.Player.id,
        subject: `re: Transfer offer for ${_target.alias}`,
        content: `
          Hi, ${_profile.Player.alias}.

          ${reason}
        `
      }
    }),
    Models.ActionQueue.create({
      type: ActionQueueTypes.TRANSFER_OFFER_RESPONSE,
      action_date: new Date(),
      payload: offerdetails
    })
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
    return teamRejectOffer( offerdetails, '' );
  }

  // does it match asking price?
  if( _target.Team && offerdetails.fee && offerdetails.fee < _target.transferValue ) {
    return teamRejectOffer( offerdetails, '' );
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
