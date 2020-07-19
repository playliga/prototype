import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { Competition, Team, Profile } from 'main/database/models';
import { League } from 'main/lib/league';
import * as IPCRouting from 'shared/ipc-routing';


interface IpcRequestParams {
  id: number;
}


interface JoinParams extends IpcRequestParams {
  teamid?: number;
  divid?: number;
}


async function start( evt: IpcMainEvent, request: IpcRequest<IpcRequestParams> ) {
  // bail if no params or response channel provided
  if( !request.params || !request.responsechannel ) {
    return;
  }

  // load the competition from the db
  const { id } = request.params;
  const comp = await Competition.findByPk( id );

  if( !comp ) {
    return;
  }

  // restore league object and start it
  const league = League.restore( comp.data );
  league.start();

  // replace the old data with the new league object
  const data = await comp.update({ data: league });
  evt.sender.send( request.responsechannel, JSON.stringify( data ) );
}


async function all( evt: IpcMainEvent, request: IpcRequest<IpcRequestParams> ) {
  if( !request.responsechannel ) {
    return;
  }

  const res = [] as any[];
  const comps = await Competition.findAll({ include: [{ all: true }] });

  comps.forEach( c => res.push({ ...c.toJSON(), data: League.restore( c.data ) }));
  evt.sender.send( request.responsechannel, JSON.stringify( res ) );
}


async function join( evt: IpcMainEvent, request: IpcRequest<JoinParams> ) {
  const compobj = await Competition.findByPk( request.params.id );
  const leagueobj = League.restore( compobj.data );

  let teamid = request.params.teamid;
  let divid = request.params.divid;

  // fetch the team
  //
  // default to user profile if no id was provided
  if( !teamid ) {
    teamid = (await Profile.getActiveProfile()).Team?.id;
  }

  const teamobj = await Team.findByPk( teamid );

  // if no division was specified, default to the lowest one
  if( !divid ) {
    divid = leagueobj.divisions.length - 1;
  }

  // save changes to db
  leagueobj.divisions[ divid ].addCompetitor( teamobj.id, teamobj.name );
  compobj.data = leagueobj;

  await compobj.save();
  await compobj.addTeam( teamid );

  // return an updated profile from the db
  evt.sender.send( request.responsechannel, JSON.stringify( await Profile.getActiveProfile() ) );
}


export default () => {
  ipcMain.on( IPCRouting.Database.COMPETITION_ALL, all );
  ipcMain.on( IPCRouting.Database.COMPETITION_JOIN, join );
  ipcMain.on( IPCRouting.Database.COMPETITION_START, start );
};
