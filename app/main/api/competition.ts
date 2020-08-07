import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { ActionQueueTypes } from 'shared/enums';
import { League, Division } from 'main/lib/league';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';


interface IpcRequestParams {
  id: number;
}


interface JoinParams extends IpcRequestParams {
  teamid?: number;
  divId?: number;
}


interface StandingsParams {
  compId?: number;
  confId?: string;
  divName?: string;
  divIdx?: number;
}


async function join( evt: IpcMainEvent, request: IpcRequest<JoinParams> ) {
  const compobj = await Models.Competition.findByPk( request.params.id, { include: [{ all: true }] });
  const leagueobj = League.restore( compobj.data );

  let teamid = request.params.teamid;
  let divid = request.params.divId;

  // fetch the team
  //
  // default to user profile if no id was provided
  if( !teamid ) {
    teamid = (await Models.Profile.getActiveProfile()).Team?.id;
  }

  const teamobj = await Models.Team.findByPk( teamid );

  // if no division was specified, default to the lowest one
  if( !divid ) {
    divid = leagueobj.divisions.length - 1;
  }

  // if the division length is already maxxed out then
  // remove the last team to make room for the user
  if( leagueobj.divisions[ divid ].size === leagueobj.divisions[ divid ].competitors.length ) {
    const lastteam = leagueobj.divisions[ divid ].competitors[ leagueobj.divisions[ divid ].competitors.length - 1 ];
    leagueobj.divisions[ divid ].removeCompetitor( lastteam.id );
    await compobj.removeTeam( compobj.Teams.find( t => t.id === lastteam.id ));
  }

  // save changes to db
  leagueobj.divisions[ divid ].addCompetitor( teamobj.id, teamobj.name );
  compobj.data = leagueobj;

  await compobj.save();
  await compobj.addTeam( teamid );

  // return an updated profile from the db
  evt.sender.send(
    request.responsechannel,
    JSON.stringify( await Models.Profile.getActiveProfile() )
  );
}


async function nextMatch( evt: IpcMainEvent, req: IpcRequest<null> ) {
  // get the next matchday in the queue
  const queue = await Models.ActionQueue.findOne({
    where: {
      type: ActionQueueTypes.MATCHDAY,
      completed: false
    }
  });

  if( !queue ) {
    return evt.sender.send( req.responsechannel, null );
  }

  // load the competition
  const compobj = await Models.Competition.findByPk( queue.payload.compId, {
    include: [ 'Continents' ]
  });

  if( !compobj.data.started ) {
    return evt.sender.send( req.responsechannel, null );
  }

  // grab the match data
  const leagueobj = League.restore( compobj.data );
  const divobj = leagueobj.getDivision( queue.payload.divId );
  const conf = divobj.conferences.find( c => c.id === queue.payload.confId );
  const match = conf.groupObj.findMatch( queue.payload.matchId );

  // build the response object and return it
  const res = {
    competition: compobj.data.name,
    competitionId: compobj.id,
    confId: conf.id,
    division: divobj.name,
    region: compobj.Continents[ 0 ].name,
    match: {
      ...match,
      team1: {
        seed: match.p[ 0 ],
        ...divobj.getCompetitorBySeed( conf, match.p[ 0 ] )
      },
      team2: {
        seed: match.p[ 1 ],
        ...divobj.getCompetitorBySeed( conf, match.p[ 1 ] )
      },
    }
  };

  evt.sender.send( req.responsechannel, JSON.stringify( res ) );
}


function genStandings( compobj: Models.Competition, divId: string | number, confId: string | null ) {
  // load the league object
  const leagueobj = League.restore( compobj.data );

  // figure out how to get the division
  let divobj: Division;

  if( typeof divId === 'string' ) {
    divobj = leagueobj.getDivision( divId );
  } else {
    divobj = leagueobj.divisions[ divId ];
  }

  // bail if specified division not found
  if( !divobj ) {
    return [];
  }

  // build base response object
  const baseobj = {
    competition: compobj.data.name,
    competitionId: compobj.id,
    division: divobj.name,
    region: compobj.Continents[ 0 ].name,
  };

  // bail if tournament not started
  if( !compobj.data.started ) {
    return [{
      ...baseobj,
      standings: []
    }];
  }

  // filter by conference id (if provided)
  let { conferences } = divobj;

  if( confId ) {
    conferences = conferences.filter( c => c.id === confId );
  }

  return conferences.map( conf => ({
    ...baseobj,
    standings: conf.groupObj.results().map( item => ({
      ...item,
      competitorInfo: divobj.getCompetitorBySeed( conf, item.seed )
    })),
  }));
}


async function standings( evt: IpcMainEvent, req: IpcRequest<StandingsParams> ) {
  let comps: Models.Competition[] = [];

  if( req.params.compId ) {
    const res = await Models.Competition.findByPk( req.params.compId, {
      include: [ 'Continents' ]
    });
    comps.push( res );
  } else {
    comps = await Models.Competition.findAll({ include: [ 'Continents' ]});
  }

  // generate the standings for the provided division
  const out = comps
    .map( c => genStandings( c, req.params.divName || req.params.divIdx, req.params.confId ) )
    .filter( c => c.length > 0 )
  ;
  evt.sender.send( req.responsechannel, JSON.stringify( out ) );
}


export default function() {
  ipcMain.on( IPCRouting.Competition.JOIN, join );
  ipcMain.on( IPCRouting.Competition.MATCHES_NEXT, nextMatch );
  ipcMain.on( IPCRouting.Competition.STANDINGS, standings );
}
