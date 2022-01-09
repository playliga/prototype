import path from 'path';
import fs from 'fs';
import { ipcMain, IpcMainEvent } from 'electron';
import { Op } from 'sequelize';
import { IpcRequest } from 'shared/types';
import { ActionQueueTypes, CompTypes } from 'shared/enums';
import { parseCupRound } from 'shared/util';
import { parseCompType } from 'main/lib/util';
import { League, Division, Cup } from 'main/lib/league';
import { Minor } from 'main/lib/circuit';
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


interface UpcomingParams {
  limit?: number;
}


/**
 * MATCH FORMATTERS
 */

function formatLeagueMatchdata( queue: Models.ActionQueue, compobj: Models.Competition, teams: Models.Team[] ) {
  const leagueobj = League.restore( compobj.data );
  const divobj = leagueobj.getDivision( queue.payload.divId );

  let conf;
  let match;
  let postseason;

  if( leagueobj.isGroupStageDone() ) {
    conf = divobj.promotionConferences.find( c => c.id === queue.payload.confId );
    match = conf.duelObj.findMatch( queue.payload.match.id );
    postseason = parseCupRound( conf.duelObj.currentRound() );
  } else {
    conf = divobj.conferences.find( c => c.id === queue.payload.confId );
    match = conf.groupObj.findMatch( queue.payload.match.id );
  }

  const team1 = divobj.getCompetitorBySeed( conf, match.p[ 0 ] );
  const team2 = divobj.getCompetitorBySeed( conf, match.p[ 1 ] );
  const team1data = teams.find( team => team.id === team1.id );
  const team2data = teams.find( team => team.id === team2.id );

  return ({
    confId: conf.id,
    division: divobj.name,
    postseason: postseason,
    match: {
      ...match,
      team1: {
        seed: match.p[ 0 ],
        logo: getTeamLogo( team1data ),
        ...team1,
      },
      team2: {
        seed: match.p[ 1 ],
        logo: getTeamLogo( team2data ),
        ...team2
      },
    }
  });
}


function formatCupMatchdata( queue: Models.ActionQueue, compobj: Models.Competition, teams: Models.Team[] ) {
  const cupobj = Cup.restore( compobj.data );
  const match = cupobj.duelObj.findMatch( queue.payload.match.id );

  const team1 = cupobj.getCompetitorBySeed( match.p[ 0 ] );
  const team2 = cupobj.getCompetitorBySeed( match.p[ 1 ] );
  const team1data = teams.find( team => team.id === team1.id );
  const team2data = teams.find( team => team.id === team2.id );

  return ({
    match: {
      ...match,
      team1: {
        seed: match.p[ 0 ],
        logo: getTeamLogo( team1data ),
        ...team1,
      },
      team2: {
        seed: match.p[ 1 ],
        logo: getTeamLogo( team2data ),
        ...team2,
      },
    }
  });
}


function formatMinorMatchdata( queue: Models.ActionQueue, compobj: Models.Competition, teams: Models.Team[] ) {
  const minorObj = Minor.restore( compobj.data );
  const currStage = minorObj.stages.find( s => s.name === queue.payload.stageName );

  const tourneyObj = queue.payload.is_playoffs ? currStage.duelObj : currStage.groupObj;
  const match = tourneyObj.findMatch( queue.payload.match.id );
  const team1 = currStage.getCompetitorBySeed( match.p[ 0 ], queue.payload.is_playoffs );
  const team2 = currStage.getCompetitorBySeed( match.p[ 1 ], queue.payload.is_playoffs );
  const team1data = teams.find( team => team.id === team1.id );
  const team2data = teams.find( team => team.id === team2.id );

  return ({
    stageName: currStage.name,
    match: {
      ...match,
      team1: {
        seed: match.p[ 0 ],
        logo: getTeamLogo( team1data ),
        ...team1,
      },
      team2: {
        seed: match.p[ 1 ],
        logo: getTeamLogo( team2data ),
        ...team2,
      },
    }
  });
}


export async function formatMatchdata( queue: Models.ActionQueue, teams: Models.Team[] ) {
  // load the competition
  const compobj = await Models.Competition.findByPk( queue.payload.compId, {
    include: [ 'Continent', 'Comptype' ]
  });

  if( !compobj.data.started ) {
    return Promise.resolve();
  }

  // response object
  let output;

  // format the match data
  const [ isleague, iscup, iscircuit ] = parseCompType( compobj.Comptype.name );

  if( isleague ) {
    output = formatLeagueMatchdata( queue, compobj, teams );
  } else if( iscup ) {
    output = formatCupMatchdata( queue, compobj, teams );
  } else if( iscircuit ) {
    output = formatMinorMatchdata( queue, compobj, teams );
  }

  // append the comptype for this match
  return Promise.resolve({
    ...output,
    competition: compobj.data.name,
    competitionId: compobj.id,
    date: queue.actionDate,
    quid: queue.id,
    region: compobj.Continent.name,
    type: parseCompType( compobj.Comptype.name ),
  });
}


/**
 * Helper functions
 */

const logoscache: Record<string, string> = {};

function getTeamLogo( teamdata: Models.Team | null ) {
  if( !teamdata || !teamdata.shortName ) {
    return null;
  }

  const logos_basedir = path.join( __dirname, 'resources/teamlogos' );
  const logo_filename = `${teamdata.shortName}.png`;
  const logo_path = path.join( logos_basedir, logo_filename );

  if( !logoscache[ logo_path ] ) {
    logoscache[ logo_path ] = fs.readFileSync( logo_path ).toString( 'base64' );
  }

  return `data:image/png;base64,${logoscache[ logo_path ]}`;
}


function getLeagueStandings( compobj: Models.Competition, teams: Models.Team[], divId: string | number, confId: string | null ) {
  // bail if comptype is not a league
  const [ isleague ] = parseCompType( compobj.Comptype.name );

  if( !isleague ) {
    return [];
  }

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
    isOpen: compobj.Compdef.isOpen,
    region: compobj.Continent.name,
    regioncode: compobj.Continent.code,
    regionId: compobj.Continent.id,
    type: parseCompType( compobj.Comptype.name )
  };

  // bail if tournament not started
  if( !compobj.data.started ) {
    return [{
      ...baseobj,
      standings: []
    }];
  }

  // handle post-season first
  if( leagueobj.isGroupStageDone() ) {
    // filter by conference
    let { promotionConferences } = divobj;

    if( confId ) {
      promotionConferences = promotionConferences.filter( c => c.id === confId );
    }

    return promotionConferences.map( conf => {
      // if tourney is done, show the last match instead
      let matches;

      if( conf.duelObj.isDone() ) {
        matches = conf.duelObj.matches.slice( -1 );
      } else {
        matches = conf.duelObj.currentRound();
      }

      return {
        ...baseobj,
        round: matches.map( match => {
          const team1 = divobj.getCompetitorBySeed( conf, match.p[ 0 ] );
          const team2 = divobj.getCompetitorBySeed( conf, match.p[ 1 ] );
          const team1data = team1 ? teams.find( team => team.id === team1.id ) : null;
          const team2data = team2 ? teams.find( team => team.id === team2.id ) : null;
          return ({
            ...match,
            team1: {
              seed: match.p[ 0 ],
              logo: getTeamLogo( team1data ),
              ...team1,
            },
            team2: {
              seed: match.p[ 1 ],
              logo: getTeamLogo( team2data ),
              ...team2
            },
          });
        })
      };
    });
  }

  // regular season
  //
  // filter by conference id (if provided)
  let { conferences } = divobj;

  if( confId ) {
    conferences = conferences.filter( c => c.id === confId );
  }

  return conferences.map( conf => ({
    ...baseobj,
    standings: conf.groupObj.results().map( item => {
      const competitor = divobj.getCompetitorBySeed( conf, item.seed );
      const teamdata = teams.find( team => team.id === competitor.id );
      return ({
        ...item,
        competitorInfo: {
          ...competitor,
          logo: getTeamLogo( teamdata )
        }
      });
    })
  }));
}


function getCupStandings( compobj: Models.Competition, teams: Models.Team[] ) {
  // bail if comptype is not a league
  const [ , iscup ] = parseCompType( compobj.Comptype.name );

  if( !iscup ) {
    return [];
  }

  // load the cup object
  const cupobj = Cup.restore( compobj.data );

  // build base response object
  const baseobj = {
    competition: compobj.data.name,
    competitionId: compobj.id,
    isOpen: compobj.Compdef.isOpen,
    region: compobj.Continent.name,
    regioncode: compobj.Continent.code,
    regionId: compobj.Continent.id,
    type: parseCompType( compobj.Comptype.name )
  };

  // bail if tournament not started
  if( !compobj.data.started ) {
    return [{
      ...baseobj,
      round: []
    }];
  }

  // or return the final result if finished!
  let matches;

  if( cupobj.duelObj.isDone() ) {
    matches = cupobj.duelObj.matches.slice( -1 );
  } else {
    matches = cupobj.duelObj.currentRound();
  }

  return [{
    ...baseobj,
    round: matches.map( match => {
      const team1 = cupobj.getCompetitorBySeed( match.p[ 0 ] );
      const team2 = cupobj.getCompetitorBySeed( match.p[ 1 ] );
      const team1data = team1 ? teams.find( team => team.id === team1.id ) : null;
      const team2data = team2 ? teams.find( team => team.id === team2.id ) : null;
      return ({
        ...match,
        team1: {
          seed: match.p[ 0 ],
          logo: getTeamLogo( team1data ),
          ...team1,
        },
        team2: {
          seed: match.p[ 1 ],
          logo: getTeamLogo( team2data ),
          ...team2
        },
      });
    })
  }];
}


function getMinorStageInfo( compobj: Models.Competition, teams: Models.Team[] ) {
  // bail if comptype is not a league
  const [ ,, iscircuit ] = parseCompType( compobj.Comptype.name );

  if( !iscircuit ) {
    return [];
  }

  // load the minor object
  const minorObj = Minor.restore( compobj.data );

  // build base response object
  const baseobj = {
    competition: compobj.data.name,
    competitionId: compobj.id,
    isOpen: compobj.Compdef.isOpen,
    region: compobj.Continent.name,
    regioncode: compobj.Continent.code,
    regionId: compobj.Continent.id,
    type: parseCompType( compobj.Comptype.name )
  };

  // bail if tournament not started
  if( !minorObj.started ) {
    return [{
      ...baseobj,
      standings: [] as any[]
    }];
  }

  // first, handle playoffs standings
  const currstage = minorObj.getCurrentStage();

  if( currstage.duelObj ) {
    let matches;

    if( currstage.duelObj.isDone() ) {
      matches = currstage.duelObj.matches.slice( -1 );
    } else {
      matches = currstage.duelObj.currentRound();
    }

    return [{
      ...baseobj,
      round: matches.map( match => {
        const team1 = currstage.getCompetitorBySeed( match.p[ 0 ], true );
        const team2 = currstage.getCompetitorBySeed( match.p[ 1 ], true );
        const team1data = team1 ? teams.find( team => team.id === team1.id ) : null;
        const team2data = team2 ? teams.find( team => team.id === team2.id ) : null;
        return ({
          ...match,
          team1: {
            seed: match.p[ 0 ],
            logo: getTeamLogo( team1data ),
            ...team1,
          },
          team2: {
            seed: match.p[ 1 ],
            logo: getTeamLogo( team2data ),
            ...team2
          },
        });
      })
    }];
  }

  // otherwise, must be group stage standings we want
  return [{
    ...baseobj,
    stageName: currstage.name,
    standings: currstage.getGroupResults().map( group => group.map( item => {
      const competitor = currstage.getCompetitorBySeed( item.seed );
      const teamdata = teams.find( team => team.id === competitor.id );
      return ({
        ...item,
        competitorInfo: {
          ...competitor,
          logo: getTeamLogo( teamdata )
        }
      });
    }))
  }];
}


/**
 * IPC Handlers
 */

async function join( evt: IpcMainEvent, request: IpcRequest<JoinParams> ) {
  const compobj = await Models.Competition.findByPk( request.params.id, { include: [{ all: true }] });
  const [ isleague, iscup, iscircuit ] = parseCompType( compobj.Comptype.name );

  let teamid = request.params.teamid;

  // fetch the team
  //
  // default to user profile if no id was provided
  if( !teamid ) {
    teamid = (await Models.Profile.getActiveProfile()).Team?.id;
  }

  const teamobj = await Models.Team.findByPk( teamid );

  if( isleague ) {
    // build league obj
    const leagueobj = League.restore( compobj.data );

    // if no division was specified, default to the lowest one
    let divid = request.params.divId;

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
    compobj.data = leagueobj.save();
  } else if( iscup ) {
    const cupobj = Cup.restore( compobj.data );
    cupobj.addCompetitor( teamobj.id, teamobj.name, teamobj.tier );
    compobj.data = cupobj.save();
  } else if( iscircuit ) {
    // build minor obj
    const minorObj = Minor.restore( compobj.data );
    const currStage = minorObj.getCurrentStage() || minorObj.stages[ 0 ];

    // if the current stage is already maxxed out then
    // remove the last team to make room for the user
    if( currStage.size === currStage.competitors.length ) {
      const lastteam = currStage.competitors[ currStage.competitors.length - 1 ];
      currStage.removeCompetitor( lastteam.id );
      await compobj.removeTeam( compobj.Teams.find( t => t.id === lastteam.id ) );
    }

    // save changes to the db
    currStage.addCompetitor( teamobj.id, teamobj.name, teamobj.tier );
    compobj.data = minorObj.save();
  }

  await compobj.save();
  await compobj.addTeam( teamid );

  // return an updated profile from the db
  evt.sender.send(
    request.responsechannel,
    JSON.stringify( await Models.Profile.getActiveProfile() )
  );
}


async function upcoming( evt: IpcMainEvent, req: IpcRequest<UpcomingParams> ) {
  // get the upcoming matchdays in the queue
  const profile = await Models.Profile.getActiveProfile();
  const queue = await Models.ActionQueue.findAll({
    limit: req.params?.limit || 5,
    order: [ [ 'actionDate', 'ASC' ] ],
    where: {
      type: ActionQueueTypes.MATCHDAY,
      actionDate: {
        [Op.gte]: profile.currentDate
      }
    },
  });

  if( !queue ) {
    return evt.sender.send( req.responsechannel, null );
  }

  // get team logos separately to improve performance.
  // sequelize many-to-many queries are really slow
  const teams = await Models.Team.findAll();

  // format the matchdays and send it back to the renderer
  const res = await Promise.all( queue.map( q => formatMatchdata( q, teams ) ) );
  evt.sender.send( req.responsechannel, JSON.stringify( res ) );
}


async function standings( evt: IpcMainEvent, req: IpcRequest<StandingsParams> ) {
  let comps: Models.Competition[] = [];

  // get team logos separately to improve performance.
  // sequelize many-to-many queries are really slow
  const teams = await Models.Team.findAll();

  // get all competitions if no id was provided
  if( req.params.compId ) {
    const res = await Models.Competition.findByPk( req.params.compId, {
      include: [ 'Continent', 'Compdef', 'Comptype' ]
    });
    comps.push( res );
  } else {
    comps = await Models.Competition.findAll({ include: [ 'Continent', 'Compdef', 'Comptype' ]});

    // filter by current season only
    comps = comps.filter( c => c.season === c.Compdef.season );
  }

  // get standings for the league types
  const leagues = comps.filter( c => c.Comptype.name === CompTypes.LEAGUE );
  const cups = comps.filter( c => c.Comptype.name === CompTypes.LEAGUE_CUP );
  const circuits = comps.filter( c => c.Comptype.name === CompTypes.CIRCUIT_MINOR || c.Comptype.name === CompTypes.CIRCUIT_MAJOR );

  // get the standings for league types
  const leaguedata = leagues
    .map( c => getLeagueStandings( c, teams, req.params.divName || req.params.divIdx, req.params.confId ) )
    .filter( c => c.length > 0 )
  ;

  // get the current round for cup types
  const cupdata = cups
    .map( c => getCupStandings( c, teams ) )
    .filter( c => c.length > 0 )
  ;

  // get the current stage standings/round for circuits
  const circuitdata = circuits
    .map( c => getMinorStageInfo( c, teams ) )
    .filter( c => c.length > 0 )
  ;

  evt.sender.send( req.responsechannel, JSON.stringify([ ...leaguedata, ...cupdata, ...circuitdata ]) );
}


export default function() {
  ipcMain.on( IPCRouting.Competition.JOIN, join );
  ipcMain.on( IPCRouting.Competition.MATCHES_UPCOMING, upcoming );
  ipcMain.on( IPCRouting.Competition.STANDINGS, standings );
}
