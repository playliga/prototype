import { CompTypes } from 'shared/enums';
import { League, Cup } from 'main/lib/league';
import { parseCupRound } from 'shared/util';
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


// ------------------------
// MATCH FORMATTERS
// ------------------------

function formatLeagueMatchdata( queue: Models.ActionQueue, compobj: Models.Competition ) {
  const leagueobj = League.restore( compobj.data );
  const divobj = leagueobj.getDivision( queue.payload.divId );

  let conf;
  let match;
  let postseason;

  if( leagueobj.isGroupStageDone() ) {
    conf = divobj.promotionConferences.find( c => c.id === queue.payload.confId );
    match = conf.duelObj.findMatch( queue.payload.matchId );
    postseason = parseCupRound( conf.duelObj.currentRound() );
  } else {
    conf = divobj.conferences.find( c => c.id === queue.payload.confId );
    match = conf.groupObj.findMatch( queue.payload.matchId );
  }

  return ({
    confId: conf.id,
    division: divobj.name,
    postseason: postseason,
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
  });
}


function formatCupMatchdata( queue: Models.ActionQueue, compobj: Models.Competition ) {
  const cupobj = Cup.restore( compobj.data );
  const match = cupobj.duelObj.findMatch( queue.payload.matchId );

  return ({
    match: {
      ...match,
      team1: {
        seed: match.p[ 0 ],
        ...cupobj.getCompetitorBySeed( match.p[ 0 ] )
      },
      team2: {
        seed: match.p[ 1 ],
        ...cupobj.getCompetitorBySeed( match.p[ 1 ] )
      },
    }
  });
}


export async function formatMatchdata( queue: Models.ActionQueue ) {
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
  const [ isleague, iscup ] = parseCompType( compobj.Comptype.name );

  if( isleague ) {
    output = formatLeagueMatchdata( queue, compobj );
  } else if( iscup ) {
    output = formatCupMatchdata( queue, compobj );
  }

  // append the comptype for this match
  return Promise.resolve({
    ...output,
    competition: compobj.data.name,
    competitionId: compobj.id,
    date: queue.actionDate,
    quid: queue.id,
    region: compobj.Continent.name,
    type: [ isleague, iscup ],
  });
}
