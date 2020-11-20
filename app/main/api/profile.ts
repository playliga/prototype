import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { Profile } from 'main/database/models';
import * as IPCRouting from 'shared/ipc-routing';
import BotExp from 'main/lib/bot-exp';


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
      if( !player.stats ) {
        return player.toJSON();
      }
      const xp = new BotExp( player.stats );
      const rankid = xp.getTierId();
      const prev = BotExp.getPrevRank( rankid );
      const next = BotExp.getNextRank( rankid );
      return {
        ...player.toJSON(),
        xp: {
          prev,
          next,
          total: BotExp.getSumOfStats( player.stats ),
          totalprev: !!prev && BotExp.getSumOfStats( prev.stats ),
          totalnext: !!next && BotExp.getSumOfStats( next.stats ),
        }
      };
    })
  ;
  evt.sender.send( request.responsechannel, JSON.stringify( squad ) );
}


export default function() {
  ipcMain.on( IPCRouting.Database.PROFILE_GET, get );
  ipcMain.on( IPCRouting.Database.PROFILE_SQUAD, getsquad );
}
