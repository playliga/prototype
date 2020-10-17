import fs from 'fs';
import path from 'path';
import ScreenManager from 'main/lib/screen-manager';
import { CompTypes } from 'shared/enums';
import * as Models from 'main/database/models';
import * as IPCRouting from 'shared/ipc-routing';


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
