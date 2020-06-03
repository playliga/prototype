import { Op } from 'sequelize';
import { random } from 'lodash';
import { OfferRequest } from 'shared/types';
import ActionQueueTypes from 'main/config/actionqueuetypes';
import * as Models from 'main/database/models';
import { League } from 'main/lib/league';
import ScreenManager from 'main/lib/screen-manager';
import PlayerWages from 'main/config/playerwages';


/**
 * Parse transfer offer sent from the user
 */

export async function rejectTransferOffer(
  profile: Models.Profile,
  target: Models.Player,
  offerdetails: OfferRequest,
  reason: string
): Promise<any> {
  /**
   * This function will:
   * - format the rejection e-mail and save it in the action queue
   * - save the transfer offer item.
   *
   * A transfer offer item is:
   *
   * owner          - who initiated the offer (team_id)
   * teamid         - the team who owns the player (can be null)
   * playerid       - the target
   * fee            - transfer fee
   * wages          - player wages
   * status         - accepted/rejected
   * reject_reason  - why it was rejected
   */

  // bail if the profile was not provided properly
  if( !profile || !profile.Player || !profile.Team ) {
    return Promise.reject();
  }

  // if the rejection was done by the team,
  // their manager sends the email
  if( offerdetails.teamid ) {
    const persona = await Models.Persona.getManagerByTeamId( offerdetails.teamid );

    if( !persona ) {
      return Promise.reject();
    }

    return Promise.all([
      Models.ActionQueue.create({
        type: ActionQueueTypes.SEND_EMAIL,
        action_date: new Date(),
        payload: {
          from: persona.id,
          to: profile.Player.id,
          subject: `re: Transfer offer for ${target.alias}`,
          content: `
            Hi, ${profile.Player.alias}.

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

  // the email for player rejections will be
  // sent by the user's assistant manager
  const persona = await Models.Persona.getManagerByTeamId( profile.Team.id, 'Assistant Manager' );

  if( !persona ) {
    return Promise.reject();
  }

  return Promise.all([
    Models.ActionQueue.create({
      type: ActionQueueTypes.SEND_EMAIL,
      action_date: new Date(),
      payload: {
        from: persona.id,
        to: profile.Player.id,
        subject: `re: Transfer offer for ${target.alias}`,
        content: `
          Hi, ${profile.Player.alias}.

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


export async function handleTransferOfferFromUser( params: OfferRequest ) {
  // load user profile
  const profile = await Models.Profile.getActiveProfile();

  if( !profile || !profile.Player || !profile.Team ) {
    return Promise.reject();
  }

  // load targeted player
  const player = await Models.Player.findByPk( params.playerid );

  if( !player ) {
    return Promise.reject();
  }

  // first, the team will decide if they
  // want to accept the transfer offer

  // is the player transfer listed?
  if( params.teamid && params.fee && !player.transferListed ) {
    return rejectTransferOffer( profile, player, params, '' );
  }

  // does it match asking price?
  if( params.teamid && params.fee && params.fee < player.transferValue ) {
    return rejectTransferOffer( profile, player, params, '' );
  }

  // the team is good with the offer. now
  // it's up to the player to decide

  // does it match their current wages?
  if( params.wages <= player.monthlyWages ) {
    return rejectTransferOffer( profile, player, params, '' );
  }

  // does it match their tier?
  if( player.tier > profile.Player.tier ) {
    return rejectTransferOffer( profile, player, params, '' );
  }

  return Promise.resolve();
}


/**
 * Assign manager and assistant managers to the user's team.
 */

export async function assignManagers() {
  // load profile and specific associations
  const profile = await Models.Profile.getActiveProfile();

  if( !profile ) {
    return Promise.reject();
  }

  // load the user's team
  const team = profile.Team;

  if( !team ) {
    return Promise.reject();
  }

  // get all personas
  let personas = await Models.Persona.findAll({
    where: { teamId: null },
    include: [
      'PersonaType',
      {
        model: Models.Country,
        include: [ 'Continent' ]
      }
    ]
  });

  // filter personas by user team's region
  personas = personas.filter( p => p.Country?.Continent?.id === team.Country?.Continent?.id );

  // try to filter by country too
  const countrymen = personas.filter( p => p.Country?.code === team.Country?.code );

  if( countrymen.length > 0 ) {
    personas = countrymen;
  }

  // group personas by type
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


/**
 * Generate the competitions after initial registration.
 */

async function genSingleComp( compdef: Models.Compdef ) {
  // get the regions
  const regionids = compdef.Continents?.map( c => c.id ) || [];
  const regions = await Models.Continent.findAll({
    where: { id: regionids }
  });

  // bail if no regions
  if( !regions ) {
    return Promise.resolve();
  }

  return Promise.all( regions.map( async region => {
    const teams = await Models.Team.findByRegionId( region.id );
    const leagueobj = new League( compdef.name );

    // add teams to the competition tiers
    compdef.tiers.forEach( ( tier, tdx ) => {
      const div = leagueobj.addDivision( tier.name, tier.minlen, tier.confsize );
      const tierteams = teams.filter( t => t.tier === tdx );
      div.addCompetitors( tierteams.slice( 0, tier.minlen ).map( t => t.id.toString() ) );
    });

    // build the competition
    const comp = Models.Competition.build({ data: leagueobj });
    await comp.save();

    // save its associations
    return Promise.all([
      comp.setCompdef( compdef ),
      comp.setContinents([ region ]),
    ]);
  }));
}


export async function genAllComps() {
  const compdefs = await Models.Compdef.findAll({
    include: [ 'Continents' ],
  });
  return compdefs.map( genSingleComp );
}


/**
 * Generate wages based off of tiers. Each
 * tier is then split into three sections:
 *
 * - Top, Mid, Bot
 *
 * Sections vary in size depending
 * on the percentage they take up.
 */

function calculateWage( player: Models.Player, high: number, low: number, modifier: number ) {
  const basewage = random( high, low );
  const transfervalue = basewage * modifier;
  player.monthlyWages = basewage;
  player.transferValue = transfervalue;
}


function calculateTierWages( players: Models.Player[], tid: number ) {
  const wages = PlayerWages[ `TIER_${tid}` ];
  const promises = [];

  if( 'TOP_PERCENT' in wages ) {
    const percent = parseFloat( wages.TOP_PERCENT ) / 100;
    const numplayers = Math.floor( players.length * percent );
    const top = players.splice( 0, numplayers );
    top.forEach( p => calculateWage( p, wages.TOP_WAGE_LOW, wages.TOP_WAGE_HIGH, wages.TOP_MODIFIER ) );
    promises.push( Promise.all( top.map( p => p.save() ) ) );
  }

  if( 'MID_PERCENT' in wages ) {
    const percent = parseFloat( wages.MID_PERCENT ) / 100;
    const numplayers = Math.floor( players.length * percent );
    const mid = players.splice( 0, numplayers );
    mid.forEach( p => calculateWage( p, wages.MID_WAGE_LOW, wages.MID_WAGE_HIGH, wages.MID_MODIFIER ) );
    promises.push ( Promise.all( mid.map( p => p.save() ) ) );
  }

  if( 'BOT_PERCENT' in wages ) {
    const percent = parseFloat( wages.BOT_PERCENT ) / 100;
    const numplayers = Math.floor( players.length * percent );
    // @todo: fix for bot_percent leaving out some players
    const bot = players.splice( 0, numplayers === players.length ? numplayers : players.length );
    bot.forEach( p => calculateWage( p, wages.BOT_WAGE_LOW, wages.BOT_WAGE_HIGH, wages.BOT_MODIFIER ) );
    promises.push( Promise.all( bot.map( p => p.save() ) ) );
  }

  return Promise.all( promises );
}


export async function calculateWages() {
  // get the top 2 tiers
  const allplayers = await Models.Player.findAll({
    where: {
      tier: { [Op.lte]: 1 }
    }
  });

  // group them into tiers
  const tier0 = allplayers.filter( p => p.tier === 0 );
  const tier1 = allplayers.filter( p => p.tier === 1 );

  // calculate wages per tier
  return Promise.all( [ tier0, tier1 ].map( calculateTierWages ) );
}


/**
 * Intro e-mail sent by assistant manager.
 */

const INTROEMAIL_DELAY = 5000;
const INTROEMAIL_TARGET_SCREEN = '/screens/main';


async function delayedIntroEmail() {
  // get team and player from the saved profile
  const profile = await Models.Profile.findOne({ include: [{ all: true }] });
  const team = profile?.Team;
  const player = profile?.Player;

  // get the asst manager for the user's team
  const persona = await Models.Persona.findOne({
    where: { teamId: team?.id || 1 },
    include: [{
      model: Models.PersonaType,
      where: { name: 'Assistant Manager' }
    }]
  });

  if( !persona || !player ) {
    return;
  }

  const emailid = await Models.Email.send({
    from: persona,
    to: player,
    subject: 'Hey!',
    content: `
      Hi, ${player.alias}.

      My name is ${persona.fname} and I am your assistant manager. I just wanted to say hello and inform you that we should start looking for your starting squad.

      Without a squad we won't be able to compete in any competitions.
    `
  });

  const email = await Models.Email.findByPk( emailid, {
    include: [{ all: true }]
  });

  ScreenManager
    .getScreenById( INTROEMAIL_TARGET_SCREEN )
    .handle
    .webContents
    .send(
      '/worldgen/email/new',
      JSON.stringify( email )
    )
  ;
}


export function sendIntroEmail() {
  setTimeout( delayedIntroEmail, INTROEMAIL_DELAY );
}
