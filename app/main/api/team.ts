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
  id: number;
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
  const data = await Promise.all( matches.map( async matchobj => {
    // these will be reassigned later
    let competition: string;
    let description: string;
    let team1id: number;
    let team2id: number;

    // partial; useful when querying for the match
    const matchidpartial = {
      s: matchobj.payload.match.id.s,
      r: matchobj.payload.match.id.r,
    };

    // populate the above vars depending
    // on the competition type
    const [ isleague, iscup, iscircuit ] = parseCompType( matchobj.Competition.Comptype.name );

    if( isleague ) {
      const leagueobj = League.restore( matchobj.Competition.data );
      const divobj = leagueobj.getDivisionByCompetitorId( teamobj.id );
      const conf = matchobj.payload.is_postseason
        ? divobj.promotionConferences.find( c => c.id === matchobj.payload.confId )
        : divobj.conferences.find( c => c.id === matchobj.payload.confId )
      ;
      if( !conf ) {
        log.warn( `Could not load match data for: ${matchobj.id}.` );
        return Promise.resolve();
      }
      competition = `${leagueobj.name}: ${divobj.name}`;
      team1id = divobj.getCompetitorBySeed( conf, matchobj.payload.match.p[ 0 ] ).id;
      team2id = divobj.getCompetitorBySeed( conf, matchobj.payload.match.p[ 1 ] ).id;

      if( matchobj.payload.is_postseason ) {
        description = `Promotion ${parseCupRound( ( conf as PromotionConference ).duelObj.findMatches( matchidpartial ) )}`;
      }
    } else if( iscup ) {
      const cupobj = Cup.restore( matchobj.Competition.data );
      competition = cupobj.name;
      description = parseCupRound( cupobj.duelObj.findMatches( matchidpartial ) );
      team1id = cupobj.getCompetitorBySeed( matchobj.payload.match.p[ 0 ] ).id;
      team2id = cupobj.getCompetitorBySeed( matchobj.payload.match.p[ 1 ] ).id;
    } else if( iscircuit ) {
      const minorObj = Minor.restore( matchobj.Competition.data );
      const stage = minorObj.stages.find( s => s.name === matchobj.payload.stageName );
      competition = minorObj.name;
      description = stage.name;
      team1id = stage.getCompetitorBySeed( matchobj.payload.match.p[ 0 ], matchobj.payload.is_playoffs || false ).id;
      team2id = stage.getCompetitorBySeed( matchobj.payload.match.p[ 1 ], matchobj.payload.is_playoffs || false ).id;
    }

    // fetch the team details and return the formatted data
    const team1 = await Models.Team.findByPk( team1id, { include: [ 'Country' ] });
    const team2 = await Models.Team.findByPk( team2id, { include: [ 'Country' ] });

    return Promise.resolve({
      id: matchobj.id,
      competition,
      season: matchobj.Competition.season,
      description,
      date: matchobj.date,
      type: parseCompType( matchobj.Competition.Comptype.name ),
      match: {
        ...matchobj.payload.match,
        team1: {
          ...team1.toJSON(),
          seed: matchobj.payload.match.p[ 0 ]
        },
        team2: {
          ...team2.toJSON(),
          seed: matchobj.payload.match.p[ 1 ]
        }
      }
    });
  }));

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
        { model: Models.Team, where: { id: req.params.id }}
      ]
    }],
  });
  evt.sender.send( req.responsechannel, JSON.stringify( comptypes ) );
}


export default function() {
  ipcMain.on( IPCRouting.Database.TEAM_COMPETITIONS, competitions );
  ipcMain.on( IPCRouting.Database.TEAM_DIVISIONS, divisions );
  ipcMain.on( IPCRouting.Database.TEAM_GET, get );
  ipcMain.on( IPCRouting.Database.TEAM_INFO, info );
}
