import log from 'electron-log';
import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import { CompTypes } from 'shared/enums';
import { parseCupRound } from 'shared/util';
import { parseCompType } from 'main/lib/util';
import { PromotionConference } from 'main/lib/league/types';
import { Cup, Division, League } from 'main/lib/league';
import * as Models from 'main/database/models';
import * as IPCRouting from 'shared/ipc-routing';


interface GetTeamRequest {
  id: number;
}


async function get( evt: IpcMainEvent, req: IpcRequest<any> ) {
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
    let description;
    let team1id;
    let team2id;

    // partial; useful when querying for the match
    const matchidpartial = {
      s: matchobj.payload.match.id.s,
      r: matchobj.payload.match.id.r,
    };

    // populate the above vars depending
    // on the competition type
    const [ isleague, iscup ] = parseCompType( matchobj.Competition.Comptype.name );

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
      description = `${leagueobj.name}: ${divobj.name}`;
      team1id = divobj.getCompetitorBySeed( conf, matchobj.payload.match.p[ 0 ] ).id;
      team2id = divobj.getCompetitorBySeed( conf, matchobj.payload.match.p[ 1 ] ).id;

      if( matchobj.payload.is_postseason ) {
        description += ` (Promotion ${parseCupRound( ( conf as PromotionConference ).duelObj.findMatches( matchidpartial ) )})`;
      }
    } else if( iscup ) {
      const cupobj = Cup.restore( matchobj.Competition.data );
      description = `${cupobj.name}: ${parseCupRound( cupobj.duelObj.findMatches( matchidpartial ) )}`;
      team1id = cupobj.getCompetitorBySeed( matchobj.payload.match.p[ 0 ] ).id;
      team2id = cupobj.getCompetitorBySeed( matchobj.payload.match.p[ 1 ] ).id;
    }

    // fetch the team details and return the formatted data
    const team1 = await Models.Team.findByPk( team1id, { include: [ 'Country' ] });
    const team2 = await Models.Team.findByPk( team2id, { include: [ 'Country' ] });

    return Promise.resolve({
      id: matchobj.id,
      description,
      date: matchobj.date,
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


export default function() {
  ipcMain.on( IPCRouting.Database.TEAM_GET, get );
}
