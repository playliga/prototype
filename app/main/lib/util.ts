import { CompTypes } from 'shared/enums';
import * as Models from 'main/database/models';
import * as IPCRouting from 'shared/ipc-routing';
import ScreenManager from 'main/lib/screen-manager';


// ------------------------
// GENERIC FUNCTIONS
// ------------------------

export function parseCompType( type: string ) {
  const leagues = [ CompTypes.CHAMPIONS_LEAGUE, CompTypes.LEAGUE ];
  const cups = [ CompTypes.LEAGUE_CUP ];

  return [
    leagues.includes( type ),
    cups.includes( type ),
  ];
}


export async function sendEmailAndEmit( payload: any ) {
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
