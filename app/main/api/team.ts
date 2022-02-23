import log from 'electron-log';
import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { CompTypes } from 'shared/enums';
import { parseCupRound } from 'shared/util';
import { buildXPTree, parseCompType } from 'main/lib/util';
import { PromotionConference } from 'main/lib/league/types';
import { Cup, Division, League } from 'main/lib/league';
import { Minor } from 'main/lib/circuit';
import { TeamLogo } from 'main/lib/cached-image';
import * as Models from 'main/database/models';
import * as IPCRouting from 'shared/ipc-routing';


interface BaseTeamRequest {
  id: string;
}


interface TeamMatchesRequest extends BaseTeamRequest {
  competitionId: string;
}


/**
 * Helper functions
 */

function getTeamLogo( teamdata: Models.Team | null ) {
  if( !teamdata || !teamdata.shortName ) {
    return null;
  }

  const teamlogo = new TeamLogo( teamdata.shortName );
  return teamlogo.getBase64();
}


async function genTeamMatchData( teamId: number, match: Models.Match ) {
  // these will be reassigned later
  let competition: string;
  let description: string;
  let team1id: number;
  let team2id: number;

  // partial; useful when querying for the match
  const matchidpartial = {
    s: match.payload.match.id.s,
    r: match.payload.match.id.r,
  };

  // populate the above vars depending
  // on the competition type
  const [ isleague, iscup, iscircuit ] = parseCompType( match.Competition.Comptype.name );

  if( isleague ) {
    const leagueobj = League.restore( match.Competition.data );
    const divobj = leagueobj.getDivisionByCompetitorId( teamId );
    const conf = match.payload.is_postseason
      ? divobj.promotionConferences.find( c => c.id === match.payload.confId )
      : divobj.conferences.find( c => c.id === match.payload.confId )
    ;
    if( !conf ) {
      log.warn( `Could not load match data for: ${match.id}.` );
      return Promise.resolve();
    }
    competition = `${leagueobj.name}: ${divobj.name}`;
    team1id = divobj.getCompetitorBySeed( conf, match.payload.match.p[ 0 ] ).id;
    team2id = divobj.getCompetitorBySeed( conf, match.payload.match.p[ 1 ] ).id;

    if( match.payload.is_postseason ) {
      description = `Promotion ${parseCupRound( ( conf as PromotionConference ).duelObj.findMatches( matchidpartial ) )}`;
    }
  } else if( iscup ) {
    const cupobj = Cup.restore( match.Competition.data );
    competition = cupobj.name;
    description = parseCupRound( cupobj.duelObj.findMatches( matchidpartial ) );
    team1id = cupobj.getCompetitorBySeed( match.payload.match.p[ 0 ] ).id;
    team2id = cupobj.getCompetitorBySeed( match.payload.match.p[ 1 ] ).id;
  } else if( iscircuit ) {
    const minorObj = Minor.restore( match.Competition.data );
    const stage = minorObj.stages.find( s => s.name === match.payload.stageName );
    competition = minorObj.name;
    description = stage.name;
    team1id = stage.getCompetitorBySeed( match.payload.match.p[ 0 ], match.payload.is_playoffs || false ).id;
    team2id = stage.getCompetitorBySeed( match.payload.match.p[ 1 ], match.payload.is_playoffs || false ).id;
  }

  // fetch the team details and return the formatted data
  const team1 = await Models.Team.findByPk( team1id, { include: [ 'Country' ] });
  const team2 = await Models.Team.findByPk( team2id, { include: [ 'Country' ] });

  return Promise.resolve({
    id: match.id,
    competition,
    season: match.Competition.season,
    description,
    date: match.date,
    type: parseCompType( match.Competition.Comptype.name ),
    match: {
      ...match.payload.match,
      team1: {
        ...team1.toJSON(),
        seed: match.payload.match.p[ 0 ]
      },
      team2: {
        ...team2.toJSON(),
        seed: match.payload.match.p[ 1 ]
      }
    }
  });
}


/**
 * IPC Handlers
 */

async function get( evt: IpcMainEvent, req: IpcRequest<BaseTeamRequest> ) {
  // grab team's matches
  const teamobj = await Models.Team.findByPk( req.params.id, {
    include: [
      { model: Models.Country },
      { model: Models.Competition, include: [ 'Comptype' ] }
    ]
  });
  const matches = await Models.Match.findAll({
    include: [
      {
        model: Models.Competition,
        include: [ 'Comptype' ]
      },
      {
        model: Models.Team,
        where: { id: req.params.id },
      }
    ]
  });

  // parse their division history
  const prevcomps = teamobj.Competitions.filter( c => c.Comptype.name === CompTypes.LEAGUE );
  const prevdivisions = prevcomps.map( comp => {
    const idx = comp.data.divisions.findIndex( ( d: Division ) => d.competitors.some( c => c.id === teamobj.id ) );
    const division = comp.data.divisions[ idx ];
    return ({ name: division.name, tier: idx, season: comp.season });
  });

  // format the match data for the frontend
  const data = await Promise.all( matches.map( match => genTeamMatchData( teamobj.id, match )) );

  // return the data
  evt.sender.send( req.responsechannel, JSON.stringify({
    ...teamobj.toJSON(),
    prevDivisions: prevdivisions,
    matches: data.filter( d => d !== undefined )
  }));
}


async function divisions( evt: IpcMainEvent, req: IpcRequest<BaseTeamRequest> ) {
  const teamobj = await Models.Team.findByPk( req.params.id, {
    include: [
      { model: Models.Country },
      { model: Models.Competition, include: [ 'Comptype' ] }
    ]
  });
  const prevdivisions = teamobj.Competitions
    .filter( c => c.Comptype.name === CompTypes.LEAGUE )
    .map( comp => {
      const idx = comp.data.divisions.findIndex( ( d: Division ) => d.competitors.some( c => c.id === teamobj.id ) );
      const division = comp.data.divisions[ idx ];
      return ({ name: division.name, tier: idx, season: comp.season });
    })
  ;
  evt.sender.send( req.responsechannel, JSON.stringify( prevdivisions ) );
}


async function info( evt: IpcMainEvent, req: IpcRequest<BaseTeamRequest> ) {
  const teamobj = await Models.Team.findByPk( req.params.id, {
    include: [
      { model: Models.Country },
      { model: Models.Player, include: [ 'Country' ]}
    ]
  });
  evt.sender.send( req.responsechannel, JSON.stringify({
    ...teamobj.toJSON(),
    Players: teamobj.Players.map( player => ({
      ...player.toJSON(),
      ...buildXPTree( player )
    })),
    logo: getTeamLogo( teamobj ),
  }));
}


async function competitions( evt: IpcMainEvent, req: IpcRequest<BaseTeamRequest> ) {
  const comptypes = await Models.Comptype.findAll({
    include: [{
      model: Models.Competition,
      attributes: [ 'id', 'season' ],
      include: [
        { model: Models.Compdef },
        { model: Models.Comptype },
        { model: Models.Team, where: { id: req.params.id }}
      ]
    }],
  });

  // reverse the order for latest seasons to be on top
  const out = comptypes.map( comptype => ({
    ...comptype.toJSON(),
    Competitions: comptype.Competitions.reverse(),
  }));
  evt.sender.send( req.responsechannel, JSON.stringify( out ) );
}


async function teamMatches( evt: IpcMainEvent, req: IpcRequest<TeamMatchesRequest> ) {
  // grab team's matches
  const matches = await Models.Match.findAll({
    include: [
      {
        model: Models.Competition,
        where: { id: req.params.competitionId },
        include: [ 'Comptype' ],
      },
      {
        model: Models.Team,
        where: { id: req.params.id },
      }
    ]
  });

  // format the match data for the frontend
  const data = await Promise.all( matches.map( match => genTeamMatchData( parseInt( req.params.id ), match )) );
  evt.sender.send( req.responsechannel, JSON.stringify( data.filter( d => d !== undefined ) ));
}


export default function() {
  ipcMain.on( IPCRouting.Database.TEAM_COMPETITIONS, competitions );
  ipcMain.on( IPCRouting.Database.TEAM_DIVISIONS, divisions );
  ipcMain.on( IPCRouting.Database.TEAM_GET, get );
  ipcMain.on( IPCRouting.Database.TEAM_INFO, info );
  ipcMain.on( IPCRouting.Database.TEAM_MATCHES, teamMatches );
}
