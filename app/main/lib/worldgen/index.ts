import { Op } from 'sequelize';
import { random } from 'lodash';
import moment from 'moment';

import * as Sqrl from 'squirrelly';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';
import * as Offer from './offer';

import { ActionQueueTypes } from 'shared/enums';
import { League } from 'main/lib/league';
import ScreenManager from 'main/lib/screen-manager';
import Application from 'main/constants/application';
import PlayerWages from 'main/constants/playerwages';
import EmailDialogue from 'main/constants/emaildialogue';


/**
 * Generic utility functions
 */

async function sendEmailAndEmit( payload: any ) {
  const email = await Models.Email.send( payload );

  ScreenManager
    .getScreenById( IPCRouting.Main._ID )
    .handle
    .webContents
    .send(
      IPCRouting.Worldgen.EMAIL_NEW,
      JSON.stringify( email )
    )
  ;

  return Promise.resolve();
}


/**
 * Calendar loop
 *
 * query action queue items for today's date
 * and execute those action items.
 *
 * bail out if:
 * - any e-mails are sent
 * - we reach MAX_ITERATIONS
 */

async function handleQueueItem( item: Models.ActionQueue ) {
  switch( item.type ) {
    case ActionQueueTypes.SEND_EMAIL:
      return sendEmailAndEmit( item.payload );
    case ActionQueueTypes.TRANSFER_OFFER_RESPONSE:
      return Models.TransferOffer.update(
        { status: item.payload.status, msg: item.payload.msg },
        { where: { id: item.payload.id } }
      );
    case ActionQueueTypes.TRANSFER_MOVE:
      return Models.Player
        .findByPk( item.payload.targetid )
        .then( player => Promise.all([
          player?.update({ monthlyWages: item.payload.wages, transferValue: item.payload.fee, transferListed: false, tier: item.payload.tier }) || Promise.reject(),
          player?.setTeam( item.payload.teamid ) || Promise.reject()
        ]))
      ;
  }
}


export async function calendarLoop() {
  // load profile
  const profile = await Models.Profile.getActiveProfile();

  if( !profile ) {
    return Promise.reject();
  }

  // iterate thru the calendar
  for( let i = 0; i < Application.CALENDAR_LOOP_MAX_ITERATIONS; i++ ) {
    // load today's action items
    const queue = await Models.ActionQueue.findAll({
      where: { actionDate: profile.currentDate }
    });

    if( queue && queue.length > 0 ) {
      await Promise.all( queue.map( handleQueueItem ) );
    }

    // update today's date
    profile.currentDate = moment( profile.currentDate )
      .add( 1, 'day' )
      .toDate()
    ;
    await profile.save();

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

    // bail out of loop if an e-mail was sent
    const hasemail = queue.findIndex( q => q.type === ActionQueueTypes.SEND_EMAIL );

    if( hasemail >= 0 ) {
      break;
    }
  }

  return Promise.resolve();
}


/**
 * Parse transfer offer sent from the user
 */

export { Offer };


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

export async function sendIntroEmail() {
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

  await sendEmailAndEmit({
    from: persona,
    to: player,
    subject: 'Hey!',
    content: Sqrl.render( EmailDialogue.INTRO, { player, persona }),
    sentAt: profile?.currentDate || new Date()
  });
}
