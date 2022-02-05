import { ipcMain, IpcMainEvent } from 'electron';
import { Op } from 'sequelize';
import { shuffle } from 'lodash';
import { IpcRequest } from 'shared/types';
import { Profile } from 'main/database/models';
import { buildXPTree, getNEAURegion } from 'main/lib/util';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';
import moment from 'moment';
import Tiers from 'shared/tiers.json';
import BotExp from 'main/lib/bot-exp';
import Application from 'main/constants/application';


interface IpcRequestParams {
  id: number;
}


interface FreeAgentsParams {
  country: string;
  limit: number;
}


async function get( evt: IpcMainEvent, request: IpcRequest<IpcRequestParams> ) {
  // bail if no response channel provided
  if( !request.responsechannel ) {
    return;
  }

  // get the profile and return to the renderer
  const data = await Profile.getActiveProfile();
  evt.sender.send( request.responsechannel, JSON.stringify( data ) );
}


async function getsquad( evt: IpcMainEvent, request: IpcRequest<null> ) {
  const profile = await Profile.getActiveProfile();
  const squad = await Promise.all( profile
    .Team
    .Players
    .filter( player => player.id !== profile.Player.id )
    .map( async player => ({
      ...player.toJSON(),
      TransferOffers: await player.getTransferOffers(),
      ...buildXPTree( player ),
    }))
  );
  evt.sender.send( request.responsechannel, JSON.stringify( squad ) );
}


async function trainsquad( evt: IpcMainEvent, req: IpcRequest<any> ) {
  // gather details for training session
  const profile = await Models.Profile.getActiveProfile();
  const players = profile.Team.Players;

  // start the training session
  const trainingsession = players.map( player => {
    // if this player is not training, reset their gains
    if( !req.params.ids.includes( player.id ) ) {
      return player.update({ gains: null });
    }

    let stats = player.stats;
    if( !stats ) {
      const tier = Tiers[ player.tier ];
      stats = tier.templates[ tier.templates.length - 1 ].stats;
    }

    const xp = new BotExp( stats );
    xp.train();
    return player.update({ stats: xp.stats, gains: xp.gains, tier: xp.getTierId()[ 0 ] });
  });

  // save the changes
  await Promise.all( trainingsession );
  await profile.update({ trainedAt: profile.currentDate });
  evt.sender.send( req.responsechannel, true );
}


async function isEligible( evt: IpcMainEvent, req: IpcRequest<any> ) {
  const profile = await Models.Profile.getActiveProfile();
  const trainedAt = moment( profile.trainedAt );
  const today = moment( profile.currentDate );
  const trained = today.diff( trainedAt, 'days' ) < Application.TRAINING_ELIGIBLE_BUFFER_DAYS;
  evt.sender.send( req.responsechannel, trained );
}


async function trainAllSquads( evt: IpcMainEvent, req: IpcRequest<any> ) {
  // grab all players except the user
  const profile = await Models.Profile.getActiveProfile();
  const players = await Models.Player.findAll({
    where: {
      id: {[Op.ne]: profile.Player.id }
    }
  });

  // start the training sessions
  const trainingsession = players.map( player => {
    let stats = player.stats;
    if( !stats ) {
      const tier = Tiers[ player.tier ];
      stats = tier.templates[ tier.templates.length - 1 ].stats;
    }
    const xp = new BotExp( stats );
    xp.train();
    return player.update({ stats: xp.stats, gains: xp.gains, tier: xp.getTierId()[ 0 ] });
  });

  // save the changes
  await Promise.all( trainingsession );
  evt.sender.send( req.responsechannel );
}


async function freeagents( evt: IpcMainEvent, req: IpcRequest<FreeAgentsParams> ) {
  // grab the countries in the same region
  // as the provided country name
  const country = await Models.Country.findOne({
    where: { name: req.params.country },
    include: [ 'Continent' ]
  });
  const countries = await Models.Country.findAll({
    include: [{
      model: Models.Continent,
      where: { code: getNEAURegion( country.Continent.code ) }
    }]
  });

  // grab the players in the same region and load their xp data
  const players = await Models.Player.findAll({
    where: { teamId: null },
    include: [{
      model: Models.Country,
      where: { id: countries.map( c => c.id ) }
    }]
  });
  const formatted = players.map( player => ({
    ...player.toJSON(),
    ...buildXPTree( player ),
  }));

  // shuffle and limit the result before returning
  const out = shuffle( formatted ).slice( 0, req.params.limit );
  evt.sender.send( req.responsechannel, JSON.stringify( out ) );
}


export default function() {
  ipcMain.on( IPCRouting.Database.PROFILE_GET, get );
  ipcMain.on( IPCRouting.Database.PROFILE_SQUAD, getsquad );
  ipcMain.on( IPCRouting.Database.PROFILE_SQUAD_FREE_AGENTS, freeagents );
  ipcMain.on( IPCRouting.Database.PROFILE_SQUAD_TRAIN, trainsquad );
  ipcMain.on( IPCRouting.Database.PROFILE_SQUAD_TRAIN_ELIGIBLE, isEligible );
  ipcMain.on( IPCRouting.Database.PROFILE_SQUAD_TRAIN_ALL, trainAllSquads );
}
