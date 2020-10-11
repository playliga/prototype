import * as Models from 'main/database/models';
import moment from 'moment';
import Application from 'main/constants/application';
import Score from './score';
import { random, flattenDeep, shuffle, flatten } from 'lodash';
import { ActionQueueTypes, CompTypes } from 'shared/enums';
import { Conference, Match, PromotionConference } from 'main/lib/league/types';
import { League, Cup, Division } from 'main/lib/league';
import { parseCompType } from 'main/lib/util';


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
 * Flattens the competition's post-season divisions
 * into a single array of competitors.
 */

function flattenCompetition( compobj: Models.Competition ) {
  const { postSeasonDivisions } = League.restore( compobj.data );
  const out: any[][] = [];

  postSeasonDivisions.forEach( ( d, tdx ) => {
    const { competitors } = d;
    const data = competitors.map( c => ({ id: c.id, tier: tdx }));
    out.push( data );
  });

  return flatten( out );
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
    const [ conf, seed ] = divobj.getCompetitorConferenceAndSeedNumById( profile.Team.id );
    userconf = conf.id;
    userseed = seed;
  }

  // bail if tourney is finished
  if( leagueobj.isDone() ) {
    return Promise.resolve([]);
  }

  // loop thru the competition's divisions and their
  // conferences and record the match days per round
  const matchdays = leagueobj.divisions.map( divobj => {
    // are we in the post-season?
    if( divobj.isGroupStageDone() ) {
      // bail if no post-season conferences.
      // e.g.: for the top division
      if( !divobj.promotionConferences.length ) {
        return [];
      }

      // have to grab the user's promotion conf/seed;
      // reset them tho if they didn't make it
      const [ _userconf, _userseed ] = divobj.getCompetitorPromotionConferenceAndSeedNumById( profile.Team.id );

      if( _userconf && _userseed ) {
        userconf = _userconf.id;
        userseed = _userseed;
      } else {
        userconf = null;
        userseed = null;
      }

      // now generate the matches for the current round
      return divobj.promotionConferences.map( conf => {
        return conf.duelObj.currentRound().map( match => ({
          type: conf.id === userconf && match.p.includes( userseed )
            ? ActionQueueTypes.MATCHDAY
            : ActionQueueTypes.MATCHDAY_NPC
          ,
          actionDate: getWeekday(
            comp.Comptype.name,
            moment( profile.currentDate ).add( 1, 'weeks' )
          ),
          payload: {
            compId: comp.id,
            confId: conf.id,
            divId: divobj.name,
            matchId: match.id,
          }
        }));
      });
    }

    // nope, must be regular season
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

  // bail if tourney is finished
  if( cupobj.duelObj.isDone() ) {
    return Promise.resolve([]);
  }

  // if user joined, grab their seed num
  let userseed: number;

  if( joined ) {
    userseed = cupobj.getCompetitorSeedNumById( profile.Team.id );
  }

  // grab matches for the current round
  const matches = cupobj
    .duelObj
    .currentRound()
    .filter( m => cupobj.duelObj.unscorable( m.id, [ 0, 1 ] ) === null )
    .map( m => ({
      type: m.p.includes( userseed )
        ? ActionQueueTypes.MATCHDAY
        : ActionQueueTypes.MATCHDAY_NPC
      ,
      actionDate: getWeekday(
        comp.Comptype.name,
        moment( profile.currentDate ).add( 1, 'weeks' )
      ),
      payload: {
        compId: comp.id,
        matchId: m.id,
      }
    }))
  ;

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
    // include south america in the NA region
    const regionids = [ region.id ];

    if( region.code === 'NA' ) {
      regionids.push( sa.id );
    }

    // was there a prev season?
    let prevcomp: Models.Competition;
    let prevleague: League;

    if( compdef.Comptype.name === CompTypes.LEAGUE ) {
      prevcomp = await Models.Competition.findOne({
        where: {
          continentId: region.id,
          compdefId: compdef.id,
          season: compdef.season - 1,
        }
      });
    }

    if( prevcomp ) {
      prevleague = League.restore( prevcomp.data );
    }

    // build the competition's eligible teams. we're going to
    // filter out the user's team if they don't have a squad
    let allteams = await Models.Team.findByRegionIds( regionids );
    let compteams: Models.Team[] = [];

    if( profile.Team.Players.length < Application.SQUAD_MIN_LENGTH ) {
      allteams = allteams.filter( t => t.id !== profile.Team.id );
    }

    // build the league or cup object
    const [ isleague, iscup ] = parseCompType( compdef.Comptype.name );
    let data: League | Cup;

    if( isleague ) {
      data = new League( compdef.name );

      compdef.tiers.forEach( ( tier, tdx ) => {
        const div = data.addDivision( tier.name, tier.minlen, tier.confsize );
        const tierteams = prevleague
          ? prevleague.postSeasonDivisions[ tdx ].competitors
          : allteams.filter( t => t.tier === tdx ).map( t => ({ id: t.id, name: t.name }))
        ;
        const competitors = prevleague
          ? tierteams
          : tierteams.slice( 0, tier.minlen )
        ;
        div.meetTwice = compdef.meetTwice;
        div.addCompetitors( competitors );
        compteams = [
          ...compteams,
          ...allteams.filter( t => competitors.some( c => c.id === t.id ) )
        ];
      });
    } else if( iscup ) {
      data = new Cup( compdef.name );

      // no tiers, every team will participate
      if( !compdef.tiers ) {
        data.addCompetitors( allteams.map( t => ({ id: t.id, name: t.name, tier: t.tier }) ) );
        compteams = allteams;
      }
    }

    // build the competition
    const season = compdef.season;
    const comp = Models.Competition.build({ data, season });
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
      comp.setContinent( region ),
      comp.setTeams( compteams )
    ]);
  }));
}


// ------------------------
// EXPORTED FUNCTIONS
// ------------------------

/**
 * Sets the date for the next season.
 */

export async function nextSeasonStartDate() {
  const profile = await Models.Profile.getActiveProfile();
  const today = moment( profile.currentDate );
  const preseason_start = moment([ today.year(), Application.PRESEASON_START_MONTH, Application.PRESEASON_START_DAY ]);
  const newseason_start = moment( preseason_start ).add( 1, 'year' ).subtract( Application.PRESEASON_PREV_END_DAYS, 'days' );

  return Models.ActionQueue.create({
    type: ActionQueueTypes.START_SEASON,
    actionDate: newseason_start,
    payload: null,
  });
}


/**
 * Bump season number on all competitions.
 */

export async function bumpSeasonNumbers() {
  const compdefs = await Models.Compdef.findAll();
  return Promise.all( compdefs.map( c => {
    c.season += 1;
    return c.save();
  }));
}


/**
 * Sync teams to their current tiers.
 */

export async function syncTiers() {
  const compdefs = await Models.Compdef.findAll({
    include: [{
      model: Models.Comptype,
      where: {
        name: CompTypes.LEAGUE
      }
    }]
  });

  // for each compdef we're going to generate a
  // list of team ids and their new tiers
  // @todo: add season to competition model
  return Promise.all( compdefs.map( async compdef => {
    const competitions = await Models.Competition.findAll({ where: { comptypeId: compdef.id } });
    const teams = flatten( competitions.map( flattenCompetition ) );
    const innerwork = teams.map( t => Models.Team.update( t, { where: { id: t.id } }) );
    return Promise.all( innerwork );
  }));
}


/**
 * Simulates an NPC matchday
 */

export async function simNPCMatchday( item: any ) {
  // these will be used later when recording the match data
  let compobj: League | Cup;
  let conf: Conference | PromotionConference;
  let match: Match;
  let team1: Models.Team;
  let team2: Models.Team;
  let is_postseason: boolean;

  // sim the match
  const competition = await Models.Competition.findByPk( item.payload.compId, { include: [ 'Comptype' ] });
  const [ isleague, iscup ] = parseCompType( competition.Comptype.name );

  if( isleague ) {
    compobj = League.restore( competition.data );
    const divobj = compobj.divisions.find( d => d.name === item.payload.divId );

    // post-season?
    if( compobj.isGroupStageDone() ) {
      conf = divobj.promotionConferences.find( c => c.id === item.payload.confId );
      match = conf.duelObj.findMatch( item.payload.matchId );
      team1 = await Models.Team.findWithSquad( divobj.getCompetitorBySeed( conf, match.p[ 0 ] ).id );
      team2 = await Models.Team.findWithSquad( divobj.getCompetitorBySeed( conf, match.p[ 1 ] ).id );
      conf.duelObj.score( item.payload.matchId, Score( team1, team2 ) );
      is_postseason = true;
      competition.data = compobj.save();

      // gen new matchdays?
      if( compobj.matchesDone({ s: match.id.s, r: match.id.r }) ) {
        await genMatchdays( competition );
      }

      // end the season?
      if( compobj.isDone() ) {
        compobj.endPostSeason();
        compobj.end();
        competition.data = compobj.save();
      }
    } else {
      conf = divobj.conferences.find( c => c.id === item.payload.confId );
      match = conf.groupObj.findMatch( item.payload.matchId );
      team1 = await Models.Team.findWithSquad( divobj.getCompetitorBySeed( conf, match.p[ 0 ] ).id );
      team2 = await Models.Team.findWithSquad( divobj.getCompetitorBySeed( conf, match.p[ 1 ] ).id );
      conf.groupObj.score( item.payload.matchId, Score( team1, team2, true ) );
      competition.data = compobj.save();
    }

    // matches scored; do we need to start the post-season?
    if( compobj.isGroupStageDone() && compobj.startPostSeason() ) {
      compobj.divisions.forEach( d => d.promotionConferences.forEach( dd => genMappool( dd.duelObj.rounds() ) ) );
      competition.data = compobj.save();
      await genMatchdays( competition );
    }
  } else if( iscup ) {
    compobj = Cup.restore( competition.data );
    match = compobj.duelObj.findMatch( item.payload.matchId );

    // can only score if it's not a BYE
    if( !compobj.duelObj.unscorable( item.payload.matchId, [ 0, 1 ] ) ) {
      team1 = await Models.Team.findWithSquad( compobj.getCompetitorBySeed( match.p[ 0 ] ).id );
      team2 = await Models.Team.findWithSquad( compobj.getCompetitorBySeed( match.p[ 1 ] ).id );
      compobj.duelObj.score( item.payload.matchId, Score( team1, team2 ) );
      competition.data = compobj.save();

      // check to see if we need to gen more matchdays
      if( compobj.matchesDone({ s: match.id.s, r: match.id.r }) ) {
        await genMatchdays( competition );
      }
    }
  }

  // record the match
  const matchobj = await Models.Match.create({
    payload: {
      match,
      confId: conf?.id,
      is_postseason: is_postseason || false,
    },
    date: item.actionDate,
  });

  // save changes to the db
  return Promise.all([
    matchobj.setCompetition( competition.id ),
    matchobj.setTeams([ team1, team2 ]),
    competition.save()
  ]);
}


/**
 * Generate map pools per round
 */

export function genMappool( rounds: Match[][] ) {
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
 * Start a competition.
 */

export function start( comp: Models.Competition ) {
  const [ isleague, iscup ] = parseCompType( comp.Comptype.name );
  let data: League | Cup;

  if( isleague ) {
    data = League.restore( comp.data );
    data.start();

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

  // generate matchdays if any were found
  if( matchdays.length > 0 ) {
    await Models.ActionQueue.bulkCreate( flattenDeep( matchdays ) );
  }

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
