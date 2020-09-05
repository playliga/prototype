import { random, flattenDeep, shuffle } from 'lodash';
import { ActionQueueTypes, CompTypes } from 'shared/enums';
import { Match } from 'main/lib/league/types';
import { League, Cup } from 'main/lib/league';
import { parseCompType } from 'shared/util';
import * as Models from 'main/database/models';
import moment from 'moment';
import Application from 'main/constants/application';


// ------------------------
// UTILITY/HELPER FUNCTIONS
// ------------------------

/**
 * Whether the team joined the specified competiton
 */

function didJoin( team: Models.Team, comp: Models.Competition ) {
  return team.Competitions.findIndex( c => c.id === comp.id ) > -1;
}


/**
 * Get the weekday that the competition's
 * matchday should be played on
 */

function getWeekday( type: string, date: moment.Moment ) {
  switch( type ) {
    case CompTypes.CHAMPIONS_LEAGUE: {
      const day = random( 0, Application.MATCHDAYS_CHAMPLEAGUE.length - 1 );
      return date.weekday( Application.MATCHDAYS_CHAMPLEAGUE[ day ] );
    }
    case CompTypes.LEAGUE: {
      const day = random( 0, Application.MATCHDAYS_LEAGUE.length - 1 );
      return date.weekday( Application.MATCHDAYS_LEAGUE[ day ] );
    }
    case CompTypes.LEAGUE_CUP: {
      const day = random( 0, Application.MATCHDAYS_LEAGUECUP.length - 1 );
      return date.weekday( Application.MATCHDAYS_LEAGUECUP[ day ] );
    }
    default:
      return;
  }
}


/**
 * Generate map pools per round
 */

function genMappool( rounds: Match[][] ) {
  const mappool = shuffle( Application.MAP_POOL );
  let mapidx = 0;

  rounds.forEach( rnd => {
    // save match metadata
    rnd.forEach( match => match.data = { map: mappool[ mapidx ]} );

    // reset if map pool index has reached
    // the end of the map pool array
    if( mapidx === mappool.length - 1 ) {
      mapidx = 0;
    } else {
      mapidx ++;
    }
  });
}


/**
 * Generate match days for a league
 */

async function genLeagueMatchdays( comp: Models.Competition ) {
  // setup vars
  const profile = await Models.Profile.getActiveProfile();
  const joined = didJoin( profile.Team, comp );
  const leagueobj = League.restore( comp.data );

  // if the user joined, grab their conf+seed numbers
  let userseed: number;
  let userconf: string;

  if( joined ) {
    const divobj = leagueobj.getDivisionByCompetitorId( profile.Team.id );
    const info = divobj.getCompetitorConferenceAndSeedNumById( profile.Team.id );
    userconf = info[ 0 ].id;
    userseed = info[ 1 ];
  }

  // loop thru the competition's divisions and their
  // conferences and record the match days per round
  const matchdays = leagueobj.divisions.map( divobj => {
    return divobj.conferences.map( conf => {
      // shuffle matches if meettwice is enabled. groupstage
      // lib has home/away games right after each other
      let rounds = conf.groupObj.rounds();

      if( divobj.meetTwice ) {
        rounds = shuffle( rounds );
      }

      // generate the matchdays
      return rounds.map( ( rnd, idx ) => {
        return rnd.map( match => ({
          type: conf.id === userconf && match.p.includes( userseed )
            ? ActionQueueTypes.MATCHDAY
            : ActionQueueTypes.MATCHDAY_NPC
          ,
          actionDate: getWeekday(
            comp.Comptype.name,
            moment( profile.currentDate ).add( idx + 1, 'weeks' )
          ),
          payload: {
            compId: comp.id,
            confId: conf.id,
            divId: divobj.name,
            matchId: match.id,
          }
        }));
      });
    });
  });

  return Promise.resolve( matchdays );
}


/**
 * Generate match days for a cup
 */

async function genCupMatchdays( comp: Models.Competition ) {
  // setup vars
  const profile = await Models.Profile.getActiveProfile();
  const joined = didJoin( profile.Team, comp );
  const cupobj = Cup.restore( comp.data );

  // if user joined, grab their seed num
  let userseed: number;

  if( joined ) {
    userseed = cupobj.getCompetitorSeedNumById( profile.Team.id );
  }

  // grab matches for the current round
  const matches = cupobj.duelObj.currentRound().map( match => ({
    type: match.p.includes( userseed )
      ? ActionQueueTypes.MATCHDAY
      : ActionQueueTypes.MATCHDAY_NPC
    ,
    actionDate: getWeekday(
      comp.Comptype.name,
      moment( profile.currentDate ).add( 1, 'weeks' )
    ),
    payload: {
      compId: comp.id,
      matchId: match.id,
    }
  }));

  // save as a single matchday
  return Promise.resolve([ matches ]);
}


/**
 * Generate a single competition based
 * off of the definition schema
 */

async function genSingleComp( compdef: Models.Compdef, profile: Models.Profile ) {
  // get south america just in case it's needed later
  const sa = await Models.Continent.findOne({ where: { code: 'SA' }});

  // now get the regions specified by the competition
  const regionids = compdef.Continents?.map( c => c.id ) || [];
  const regions = await Models.Continent.findAll({
    where: { id: regionids }
  });

  // bail if no regions
  if( !regions || !sa ) {
    return Promise.resolve();
  }

  return Promise.all( regions.map( async region => {
    // north america also includes south america
    const regionids = [ region.id ];

    if( region.code === 'NA' ) {
      regionids.push( sa.id );
    }

    // skip user's team because they don't have a squad yet
    let teams = await Models.Team.findByRegionIds( regionids );
    teams = teams.filter( t => t.id !== profile.Team.id );

    // build the league or cup object
    const [ isleague, iscup ] = parseCompType( compdef.Comptype.name );
    let data: League | Cup;

    if( isleague ) {
      data = new League( compdef.name );

      compdef.tiers.forEach( ( tier, tdx ) => {
        const div = data.addDivision( tier.name, tier.minlen, tier.confsize );
        const tierteams = teams.filter( t => t.tier === tdx );
        const competitors = tierteams
          .slice( 0, tier.minlen )
          .map( t => ({ id: t.id, name: t.name }) )
        ;
        div.meetTwice = compdef.meetTwice;
        div.addCompetitors( competitors );
      });
    } else if( iscup ) {
      data = new Cup( compdef.name );

      // no tiers, every team will participate
      if( !compdef.tiers ) {
        data.addCompetitors( teams.map( t => ({ id: t.id, name: t.name }) ) );
      }
    }

    // build the competition
    const comp = Models.Competition.build({ data });
    await comp.save();

    // add its start date to its action queue
    await Models.ActionQueue.create({
      type: ActionQueueTypes.START_COMP,
      actionDate: moment( profile.currentDate ).add( compdef.startOffset, 'days' ),
      payload: comp.id
    });

    // save its associations
    return Promise.all([
      comp.setCompdef( compdef ),
      comp.setComptype( compdef.Comptype ),
      comp.setContinents([ region ]),
      comp.setTeams( teams )
    ]);
  }));
}


// ------------------------
// EXPORTED FUNCTIONS
// ------------------------

/**
 * Start a competition.
 */

export function start( comp: Models.Competition ) {
  const [ isleague, iscup ] = parseCompType( comp.Comptype.name );
  let data: League | Cup;

  if( isleague ) {
    data = League.restore( comp.data );
    data.start();

    // shuffle divisions before starting
    data.divisions.forEach( divobj => {
      divobj.competitors = shuffle( divobj.competitors );
    });

    // assign maps to each round's matches
    data.divisions.forEach( divObj => {
      divObj.conferences.forEach( conf => {
        genMappool( conf.groupObj.rounds() );
      });
    });
  } else if( iscup ) {
    data = Cup.restore( comp.data );
    data.start();
    genMappool( data.duelObj.rounds() );
  }

  return comp.update({ data: data.save() });
}


/**
 * Generates matchdays for a competition
 */

export async function genMatchdays( comp: Models.Competition ) {
  const [ isleague, iscup ] = parseCompType( comp.Comptype.name );
  let matchdays: any[];

  if( isleague ) {
    matchdays = await genLeagueMatchdays( comp );
  } else if( iscup ) {
    matchdays = await genCupMatchdays( comp );
  }

  await Models.ActionQueue.bulkCreate( flattenDeep( matchdays ) );
  return Promise.resolve();
}


/**
 * Generate the competitions after initial registration.
 */

export async function genAllComps() {
  const compdefs = await Models.Compdef.findAll({
    include: [ 'Continents', 'Comptype' ],
  });
  const profile = await Models.Profile.getActiveProfile();
  return compdefs.map( c => genSingleComp( c, profile ) );
}
