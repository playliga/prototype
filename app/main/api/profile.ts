import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { Profile } from 'main/database/models';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';
import moment from 'moment';
import Tiers from 'shared/tiers';
import BotExp from 'main/lib/bot-exp';
import Application from 'main/constants/application';


interface IpcRequestParams {
  id: number;
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
  const squad = profile
    .Team
    .Players
    .filter( player => player.id !== profile.Player.id )
    .map( player => {
      let stats = player.stats;
      if( !stats ) {
        const tier = Tiers[ Tiers.length - 1 ];
        stats = tier.templates[ tier.templates.length - 1 ].stats;
      }
      const xp = new BotExp( stats );
      const rankid = xp.getTierId();
      const current = Tiers[ rankid[ 0 ] ].templates[ rankid[ 1 ] ];
      const prev = BotExp.getPrevRank( rankid );
      const next = BotExp.getNextRank( rankid );
      return {
        ...player.toJSON(),
        stats,
        xp: {
          prev,
          current,
          next,
          total: BotExp.getSumOfStats( stats ),
          totalprev: !!prev && BotExp.getSumOfStats( prev.stats ),
          totalcurrent: !!current && BotExp.getSumOfStats( current.stats ),
          totalnext: !!next && BotExp.getSumOfStats( next.stats ),
        }
      };
    })
  ;
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
      const tier = Tiers[ Tiers.length - 1 ];
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


export default function() {
  ipcMain.on( IPCRouting.Database.PROFILE_GET, get );
  ipcMain.on( IPCRouting.Database.PROFILE_SQUAD, getsquad );
  ipcMain.on( IPCRouting.Database.PROFILE_SQUAD_TRAIN, trainsquad );
  ipcMain.on( IPCRouting.Database.PROFILE_SQUAD_TRAIN_ELIGIBLE, isEligible );
}
