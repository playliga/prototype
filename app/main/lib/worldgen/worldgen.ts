import * as Sqrl from 'squirrelly';
import * as Models from 'main/database/models';
import { random } from 'lodash';
import { Op } from 'sequelize';
import { ActionQueueTypes } from 'shared/enums';
import { sendEmailAndEmit } from 'main/lib/util';
import moment from 'moment';
import PlayerWages from 'main/constants/playerwages';
import EmailDialogue from 'main/constants/emaildialogue';
import Application from 'main/constants/application';


/**
 * Trims completed items from the action queue.
 */

export async function trimActionQueue() {
  return Models.ActionQueue.destroy({
    where: {
      completed: 1,
    }
  });
}


/**
 * Add preseason checks
 */

export async function preseasonChecks() {
  const profile = await Models.Profile.getActiveProfile();
  const persona = await Models.Persona.getManagerByTeamId( profile.Team.id, 'Assistant Manager' );
  const first_comp = await Models.ActionQueue.findOne({
    order: [
      [ 'actionDate', 'ASC' ]
    ],
    where: {
      type: ActionQueueTypes.START_COMP,
      actionDate: {
        [Op.gte]: profile.currentDate
      }
    }
  });

  // send an e-mail before the first matchday to explain how to play
  const actions = [{
    type: ActionQueueTypes.SEND_EMAIL,
    actionDate: moment( first_comp.actionDate ),
    payload: {
      from: persona.id,
      to: profile.Player.id,
      subject: 'Our upcoming match',
      content: Sqrl.render( EmailDialogue.INTRO_HOW_TO_PLAY, { player: profile.Player }),
      sentAt: moment( first_comp.actionDate ),
    }
  }];

  return Models.ActionQueue.bulkCreate( actions );
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


/**
 * Schedule the end of season e-mail.
 */

export async function scheduleEndSeasonReport() {
  // get the date for the start of the next season
  // subtract a day to schedule the report
  const action = await Models.ActionQueue.findOne({
    where: {
      completed: false,
      type: ActionQueueTypes.START_SEASON
    },
    order: [
      [ 'id', 'DESC' ]
    ],
  });

  return Models.ActionQueue.create({
    type: ActionQueueTypes.ENDSEASON_REPORT,
    actionDate: moment( action.actionDate ).subtract( 1, 'day' ),
    payload: null,
  });
}


/**
 * Schedule distribution of competition prize money
 */

export async function schedulePrizeMoneyDistribution() {
  // get the date for the start of the next season
  // subtract a week to schedule the report
  const action = await Models.ActionQueue.findOne({
    where: {
      completed: false,
      type: ActionQueueTypes.START_SEASON
    },
    order: [
      [ 'id', 'DESC' ]
    ],
  });

  return Models.ActionQueue.create({
    type: ActionQueueTypes.ENDSEASON_PRIZE_MONEY,
    actionDate: moment( action.actionDate ).subtract( 1, 'week' ),
    payload: null,
  });
}
