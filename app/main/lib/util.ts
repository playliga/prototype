import fs from 'fs';
import path from 'path';
import Tiers from 'shared/tiers';
import ScreenManager from 'main/lib/screen-manager';
import BotExp from 'main/lib/bot-exp';
import { CompTypes } from 'shared/enums';
import * as Models from 'main/database/models';
import * as IPCRouting from 'shared/ipc-routing';


// ------------------------
// GENERIC FUNCTIONS
// ------------------------

export function parseCompType( type: string ) {
  const leagues = [ CompTypes.LEAGUE ];
  const cups = [ CompTypes.LEAGUE_CUP ];
  const circuits = [ CompTypes.CIRCUIT_MAJOR, CompTypes.CIRCUIT_MINOR ];

  return [
    leagues.includes( type ),
    cups.includes( type ),
    circuits.includes( type ),
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


// ------------------------------
// WALK DIRECTORY TREE
//
// Returns as an array of strings
// ------------------------------

export function walk( dir: string ) {
  const dirs = fs.readdirSync( dir );
  const files: any = dirs.map( ( file: any ) => {
    const filePath = path.join( dir, file );
    const stats = fs.statSync( filePath );
    if( stats.isDirectory() ) return walk( filePath );
    else if( stats.isFile() ) return filePath;
  });

  return files.reduce(
    ( all: any, folderContents: any ) => all.concat( folderContents ),
    []
  );
}


/**
 * Build a player's XP tree
 */

export function buildXPTree( player: Models.Player ) {
  let stats = player.stats;
  if( !stats ) {
    const tier = Tiers[ player.tier ];
    stats = tier.templates[ tier.templates.length - 1 ].stats;
  }
  const xp = new BotExp( stats );
  const rankid = xp.getTierId();
  const current = Tiers[ rankid[ 0 ] ].templates[ rankid[ 1 ] ];
  const prev = BotExp.getPrevRank( rankid );
  const next = BotExp.getNextRank( rankid );
  return {
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
}
