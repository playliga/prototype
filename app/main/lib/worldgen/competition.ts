import * as Models from 'main/database/models';
import moment from 'moment';
import log from 'electron-log';
import Application from 'main/constants/application';
import Score from './score';
import { random, flattenDeep, shuffle, flatten, groupBy, uniqBy } from 'lodash';
import { ActionQueueTypes, AutofillAction, CompTypes } from 'shared/enums';
import { Match, Tournament } from 'main/lib/league/types';
import { League, Cup, Division } from 'main/lib/league';
import { Minor, Stage } from 'main/lib/circuit';
import { parseCompType } from 'main/lib/util';


// ------------------------
// UTILITY/HELPER FUNCTIONS
// ------------------------

/**
 * Whether the team joined the specified competiton
 */

function didJoin( teamcompetitions: Models.Competition[], comp: Models.Competition ) {
  return teamcompetitions.findIndex( c => c.id === comp.id ) > -1;
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
    case CompTypes.LEAGUE: {
      const day = random( 0, Application.MATCHDAYS_LEAGUE.length - 1 );
      return date.weekday( Application.MATCHDAYS_LEAGUE[ day ] );
    }
    case CompTypes.LEAGUE_CUP: {
      const day = random( 0, Application.MATCHDAYS_LEAGUECUP.length - 1 );
      return date.weekday( Application.MATCHDAYS_LEAGUECUP[ day ] );
    }
    case CompTypes.CIRCUIT_MAJOR:
    case CompTypes.CIRCUIT_MINOR: {
      const day = random( 0, Application.MATCHDAYS_MINOR.length - 1 );
      return date.weekday( Application.MATCHDAYS_MINOR[ day ] );
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
  const competitions = await Models.Competition.findAllByTeam( profile.Team.id );
  const joined = didJoin( competitions, comp );
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
            team1Id: divobj.getCompetitorBySeed( conf, match.p[ 0 ] ).id,
            team2Id: divobj.getCompetitorBySeed( conf, match.p[ 1 ] ).id,
            match,
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
            team1Id: divobj.getCompetitorBySeed( conf, match.p[ 0 ] ).id,
            team2Id: divobj.getCompetitorBySeed( conf, match.p[ 1 ] ).id,
            match,
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
  const competitions = await Models.Competition.findAllByTeam( profile.Team.id );
  const joined = didJoin( competitions, comp );
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
        match: m,
        team1Id: cupobj.getCompetitorBySeed( m.p[ 0 ] ).id,
        team2Id: cupobj.getCompetitorBySeed( m.p[ 1 ] ).id,
      }
    }))
  ;

  // save as a single matchday
  return Promise.resolve([ matches ]);
}


/**
 * Generate match days for a minor
 */

async function genMinorMatchdays( comp: Models.Competition ) {
  // setup vars
  const profile = await Models.Profile.getActiveProfile();
  const competitions = await Models.Competition.findAllByTeam( profile.Team.id );
  const joined = didJoin( competitions, comp );
  const minorObj = Minor.restore( comp.data );
  const currStage = minorObj.getCurrentStage();
  const tourneyObj = currStage.duelObj || currStage.groupObj;
  const isPlayoffs = currStage.duelObj && currStage.playoffCompetitors && currStage.playoffCompetitors.length > 0;

  // bail if tourney is finished
  if( minorObj.isDone() ) {
    return Promise.resolve([]);
  }

  // if user joined, grab their seed num
  let userseed: number;

  if( joined ) {
    userseed = currStage.getCompetitorSeedNumById( profile.Team.id, isPlayoffs );
  }

  // generate the match action queue item
  const genMatchActionQueue = ( m: Match, offset = 1 ) => ({
    type: m.p.includes( userseed )
      ? ActionQueueTypes.MATCHDAY
      : ActionQueueTypes.MATCHDAY_NPC
    ,
    actionDate: getWeekday(
      comp.Comptype.name,
      moment( profile.currentDate ).add( offset + 1, 'weeks' )
    ),
    payload: {
      compId: comp.id,
      match: m,
      stageName: currStage.name,
      is_playoffs: isPlayoffs,
      team1Id: currStage.getCompetitorBySeed( m.p[ 0 ], isPlayoffs ).id,
      team2Id: currStage.getCompetitorBySeed( m.p[ 1 ], isPlayoffs ).id,
    }
  });

  // generate the matches
  const matches = isPlayoffs
    ? tourneyObj
      .currentRound()
      .filter( m => tourneyObj.unscorable( m.id, [ 0, 1 ] ) === null )
      .map( m => genMatchActionQueue( m ) )
    : tourneyObj
      .rounds()
      .map( ( rnd, idx ) => rnd.map( m => genMatchActionQueue( m, idx ) ) )
  ;

  // save as a single matchday
  return Promise.resolve([ matches ]);
}


/**
 * Parse autofill syntax.
 *
 * This can be called against a competition to populate it
 * with players depending on the criteria specified in the syntax.
 *
 * @todo: turn this into a reusable autofill library
 */

function parseAutoFillWhereClause( autofill: any, compdefs: Models.Compdef[], compdef: Models.Compdef, regions?: Models.Continent[] ) {
  const where: Record<string, any> = {
    compdefId: compdefs.find( c => c.Comptype.name === autofill.comptype ).id,
  };
  if( autofill.region && regions ) {
    where.continentId = regions.find( r => r.code.toLowerCase() === autofill.region.toLowerCase() ).id;
  }
  if( autofill.season ) {
    where.season = compdef.season + parseInt( autofill.season );
  }
  return where;
}


async function parseAutoFillQuery( autofill: any, teams: Models.Team[], compdefs: Models.Compdef[], compdef: Models.Compdef, regions?: Models.Continent[] ) {
  // search for the competition
  const autofill_comp = await Models.Competition.findOne({ where: parseAutoFillWhereClause( autofill, compdefs, compdef, regions ) });

  if( autofill_comp ) {
    const compobj = Minor.restore( autofill_comp.data );
    const stage = compobj.stages[ parseInt( autofill.tier ) ];
    const tourneyobj = stage.duelObj || stage.groupObj;
    const competitors = tourneyobj
      .results()
      .slice( parseInt( autofill.start ), parseInt( autofill.end ) )
      .map( c => stage.getCompetitorBySeed( c.seed, !!stage.duelObj ) )
    ;
    return Promise.resolve( teams.filter( team => competitors.some( c => c.id === team.id ) ) );
  }

  return Promise.resolve([]);
}


function parseAutofillValue( autofill: string ) {
  const output: Record<string, string> = {};
  autofill
    .split( Application.AUTOFILL_ITEM_SEPARATOR )
    .map( item => item.split( Application.AUTOFILL_VALUE_SEPARATOR ) )
    .forEach( item => output[item[0]] = item[1] )
  ;
  return output;
}


async function parseAutofillTypes( data: any, idx: number, autofill: any, teams: Models.Team[], compdefs: Models.Compdef[], compdef: Models.Compdef, regions?: Models.Continent[]): Promise<Models.Team[]> {
  // fill competitors list using any of the known actions
  let competitors: Models.Team[] = [];

  switch( autofill.action ) {
    case AutofillAction.EXCLUDE: {
      const excluded = await parseAutoFillQuery( autofill, teams, compdefs, compdef, regions );

      if( excluded && excluded.length > 0 ) {
        competitors = teams.filter( team => excluded.some( c => c.id === team.id ) );
      }

      return Promise.resolve( competitors );
    }
    case AutofillAction.INVITE: {
      competitors = await parseAutoFillQuery( autofill, teams, compdefs, compdef, regions );
      break;
    }
    case AutofillAction.OPEN: {
      competitors = teams
        .filter( t => t.tier === parseInt( autofill.tier ) )
        .slice( parseInt( autofill.start ), parseInt( autofill.end ) )
      ;
      break;
    }
  }

  // no results, do we have a fallback?
  if( competitors.length === 0 && data.fallback && data.fallback[ idx ] ) {
    return parseAutofillTypes( data, idx, parseAutofillValue( data.fallback[ idx ] ), teams, compdefs, compdef, regions );
  }

  // we have results but do we have any exclusions?
  if( data.exclude ) {
    let excluded = await Promise.all( data.exclude.map( ( exclude: any ) => parseAutofillTypes( data, idx, parseAutofillValue( exclude ), competitors, compdefs, compdef, regions ) ) );
    excluded = uniqBy( flatten( excluded ), 'id' );
    competitors = competitors.filter( team => !excluded.some( ex => ex.id === team.id ) );
  }

  // return our list of competitors
  return Promise.resolve( shuffle( competitors ) );
}


async function parseAutoFill( data: any, teams: Models.Team[], compdefs: Models.Compdef[], compdef: Models.Compdef, regions?: Models.Continent[] ) {
  if( !data || !data.items ) {
    return Promise.resolve([]);
  }

  const work = data.items.map( ( item: string, idx: number ) => {
    const autofill = parseAutofillValue( item );
    return parseAutofillTypes( data, idx, autofill, teams, compdefs, compdef, regions );
  });

  const results = await Promise.all( work );
  return Promise.resolve( flatten( results ).slice( 0, data.limit ) );
}


/**
 * Generate a single competition based
 * off of the definition schema
 */

async function genSingleComp( compdef: Models.Compdef, profile: Models.Profile, compdefs: Models.Compdef[], region?: Models.Continent ) {
  let regionids = [];

  // if no region was specified, then this is an international
  // competition and we grab all the main regions
  if( !region ) {
    const regions = await Models.Continent.findAll();
    regionids = regions.map( r => r.id );
  } else {
    // grab countries from alt regions too
    const altregions = await Promise.all( Application.NAEU_REGION_MAP[ region.code as 'NA' | 'EU' ].map( item => {
      return Models.Continent.findOne({ where: { code: item }});
    }));
    regionids = [ region.id, ...altregions.map( region => region.id ) ];
  }

  // build the competition's eligible teams. we're going to
  // filter out the user's team if they don't have a squad
  let allteams = await Models.Team.findByRegionIds( regionids );
  let compteams: Models.Team[] = [];

  if( profile.Team.Players.length < Application.SQUAD_MIN_LENGTH ) {
    allteams = allteams.filter( t => t.id !== profile.Team.id );
  }

  // build the league or cup object
  const [ isleague, iscup, iscircuit ] = parseCompType( compdef.Comptype.name );
  let data: League | Cup | Minor;

  if( isleague ) {
    data = new League( compdef.name );

    // was there a prev season?
    // @note: this assumes that all leagues have a region
    let prevtourney: League;

    const prevcomp = await Models.Competition.findOne({
      where: {
        continentId: region.id,
        compdefId: compdef.id,
        season: compdef.season - 1,
      }
    });

    if( prevcomp ) {
      prevtourney = League.restore( prevcomp.data );
    }

    compdef.tiers.forEach( ( tier, tdx ) => {
      const div = data.addDivision( tier.name, tier.minlen, tier.confsize );
      const tierteams = prevtourney
        ? prevtourney.postSeasonDivisions[ tdx ].competitors
        : allteams.filter( t => t.tier === tdx ).map( t => ({ id: t.id, name: t.name }))
      ;
      const competitors = prevtourney
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
  } else if( iscircuit ) {
    data = new Minor( compdef.name );

    // there is a db call in a nested for-loop
    // so this whole block becomes async
    await Promise.all( compdef.tiers.map( async tier => {
      const stage = data.addStage( tier.name, tier.size, tier.groupSize, tier.playoffs || false );
      let competitors: Models.Team[] = [];

      // autofill logic
      if( tier.autofill ) {
        const autofill = tier.autofill.find( ( a: any ) => a.type === ActionQueueTypes.START_SEASON );
        competitors = await parseAutoFill( autofill, allteams, compdefs, compdef );
      }

      // add teams to the current stage and the competition model
      competitors = flatten( competitors ).slice( 0, tier.size );
      stage.addCompetitors( competitors.map( t => ({ id: t.id, name: t.name, tier: t.tier }) ) );
      compteams = [ ...compteams, ...uniqBy( competitors, 'id' ) ];
      return Promise.resolve();
    }));
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
}


async function addTeamToCompetition( compobj: Models.Competition, teamobj: Models.Team ) {
  const [ isleague, iscup, iscircuit ] = parseCompType( compobj.Comptype.name );

  // bail early if team is already in the competition
  if( compobj.Teams.some( team => team.id === teamobj.id ) ) {
    return Promise.resolve();
  }

  if( isleague ) {
    // build league obj
    const leagueobj = League.restore( compobj.data );

    // default to the lowest division
    const divid = leagueobj.divisions.length - 1;

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

  return [
    compobj.save(),
    compobj.addTeam( teamobj )
  ];
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
 * Simulates an NPC matchday and saves it as a Match in the database.
 *
 * Note that this is *not* modify the matches competition object.
 */

export async function simNPCMatchday( item: any ) {
  // grab competition info
  const competition = await Models.Competition.findByPk( item.payload.compId, { include: [ 'Comptype' ] });
  const [ isleague,, iscircuit ] = parseCompType( competition.Comptype.name );
  const match: Match = item.payload.match;

  // for leagues we need to figure out if post-season
  const is_postseason = isleague && item.payload.divId
    ? (competition.data.divisions as Division[]).find( d => d.name === item.payload.divId )?.promotionConferences.length > 0
    : false
  ;

  // are draws allowed?
  const conditions = [
    isleague && !is_postseason,
    iscircuit && item.payload.is_playoffs === null,
  ];
  const allow_draws = conditions.some( c => c );

  // sim the match
  const team1 = await Models.Team.findWithSquad( item.payload.team1Id );
  const team2 = await Models.Team.findWithSquad( item.payload.team2Id );
  match.m = Score( team1, team2, allow_draws ) as [ number, number ];

  // we can't have any ties during playoffs or cup-ties
  if( !allow_draws && match.m[ 0 ] === match.m[ 1 ] ) {
    log.error( '>> COULD NOT SCORE.', match.m, team1.name, team2.name );
    log.error(` >> GENERATING A NEW ONE WHERE ${team2.name} ALWAYS WINS...` );
    match.m = [ random( 0, 14 ), 16 ];
  }

  // record the match
  const matchobj = await Models.Match.create({
    payload: {
      match,
      confId: item.payload?.confId,
      divId: item.payload?.divId,
      is_postseason: is_postseason,
      is_playoffs: item.payload.is_playoffs,
      stageName: item.payload?.stageName,
    },
    date: item.actionDate,
  });

  try {
    await matchobj.setTeams([ team1, team2 ]);
  } catch( err ) {
    log.warn( `AN INVALID MATCHDAY WAS GENERATED FOR ${competition.Comptype.name}. SKIPING...` );
    log.warn( `TEAM1=${team1.name}; TEAM2=${team2.name}` );
  }

  // save changes to the db
  return matchobj.setCompetition( competition.id );
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

export async function start( comp: Models.Competition ) {
  const [ isleague, iscup, iscircuit ] = parseCompType( comp.Comptype.name );
  let data: League | Cup | Minor;

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
  } else if( iscircuit ) {
    // global circuits support autofill logic
    data = Minor.restore( comp.data );

    // build the list of eligible teams to autofill from
    const regions = await Models.Continent.findAll();
    const allteams = await Models.Team.findByRegionIds( regions.map( r => r.id ) );
    const compdefs = await Models.Compdef.findAll({ include: [ 'Continents', 'Comptype' ] });

    // autofill logic
    const compteams = await Promise.all( comp.Compdef.tiers.map( async tier => {
      if( !tier.autofill ) {
        return Promise.resolve([]);
      }

      let competitors: Models.Team[];
      const autofill = tier.autofill.find( ( a: any ) => a.type === ActionQueueTypes.START_COMP );
      const stage = data.stages.find( ( s: any ) => s.name === tier.name );
      competitors = await parseAutoFill( autofill, allteams, compdefs, comp.Compdef, regions );
      competitors = shuffle( flatten( competitors ).slice( 0, tier.size ) );
      stage.addCompetitors( competitors.map( t => ({ id: t.id, name: t.name, tier: t.tier }) ) );
      return Promise.resolve( competitors );
    }));

    // if autofill added teams, let's set the db relationship here
    const autofilled = uniqBy( flatten( compteams ), 'id' );

    if( autofilled.length > 0 ) {
      try {
        await comp.setTeams( autofilled );
      } catch( err ) {
        log.warn( `DUPLICATE TEAM FOUND WHEN STARTING: id=${comp.id}; name=${comp.Compdef.name}` );

        const found = [] as any[];
        data.stages.forEach( stage => {
          stage.competitors.forEach( competitor => {
            if( !found.some( d => d.id === competitor.id ) ) {
              found.push( competitor );
            } else {
              log.warn( `FOUND: ${competitor.name} IN ${stage.name} FOR ${comp.Comptype.name}` );
            }
          });
        });

        // add them regardless :(
        await comp.setTeams( autofilled, { ignoreDuplicates: true });
      }
    }

    // start the competition and gen the map pool
    data.start();
    genMappool( data.getCurrentStage().groupObj.rounds() );
  }

  return comp.update({ data: data.save() });
}


/**
 * Generates matchdays for a competition
 */

export async function genMatchdays( comp: Models.Competition ) {
  const [ isleague, iscup, iscircuit ] = parseCompType( comp.Comptype.name );
  let matchdays: any[];

  if( isleague ) {
    matchdays = await genLeagueMatchdays( comp );
  } else if( iscup ) {
    matchdays = await genCupMatchdays( comp );
  } else if( iscircuit ) {
    matchdays = await genMinorMatchdays( comp );
  }

  // generate matchdays if any were found
  if( matchdays.length > 0 ) {
    await Models.ActionQueue.bulkCreate( flattenDeep( matchdays ) );
  }

  return Promise.resolve();
}


/**
 * Records today's matches in their
 * respective Competition objects.
 */

function recordMatchItem( match: Models.Match, compobj: League | Cup | Minor, compinfo: boolean[] ) {
  const payload = JSON.parse( match.payload );
  const [ isleague, iscup, iscircuit ] = compinfo;
  let tourneyobj: Tournament;

  if( isleague ) {
    const divobj = (compobj as League).divisions.find( d => d.name === payload.divId );

    // regular season?
    if( !compobj.isGroupStageDone() ) {
      const conf = divobj.conferences.find( c => c.id === payload.confId );
      tourneyobj = conf.groupObj;
    } else {
      const conf = divobj.promotionConferences.find( c => c.id === payload.confId );
      tourneyobj = conf.duelObj;
    }
  } else if( iscup ) {
    tourneyobj = compobj.duelObj;
  } else if( iscircuit ) {
    tourneyobj = compobj.getCurrentStage().duelObj || compobj.getCurrentStage().groupObj;
  }

  // record the score
  if( !tourneyobj.unscorable( payload.match.id, [ 0, 1 ] ) ) {
    tourneyobj.score( payload.match.id, payload.match.m );
  }

  // gen new matches if any of these return true
  const roundIsDone = compobj.matchesDone({ s: payload.match.id.s, r: payload.match.id.r });
  const conditions = [
    // postseason matches are done?
    isleague && compobj.isGroupStageDone() && roundIsDone,

    // cup round is over?
    iscup && roundIsDone,

    // circuits are a bit more complex
    //
    // first, if we're in playoffs check if the round is over
    iscircuit && roundIsDone,

    // now check if groupstage is done
    // and we need to start the playoffs
    iscircuit && ( () => {
      const currStage: Stage = compobj.getCurrentStage();

      // start the next stage of the minor?
      if( compobj.start() ) {
        return true;
      }

      // does this stage have playoffs to start?
      return (
        currStage.playoffs
        && currStage.isGroupStageDone()
        && !currStage.duelObj
      );
    })()
  ];

  return conditions.includes( true );
}


export async function recordTodaysMatchResults() {
  const profile = await Models.Profile.getActiveProfile();

  // get today's match results
  const rawmatches = await Models.Match.findAll({
    where: { date: profile.currentDate },
    raw: true, // to be able to access `competitionId`
  });

  // group them together by competition id
  const groupedMatches = groupBy( rawmatches, 'competitionId' );
  const competitionIds = Object.keys( groupedMatches );

  return Promise.all( competitionIds.map( async competitionId => {
    // load competition details
    const competition = await Models.Competition.findByPk( competitionId, { include: [ 'Comptype' ] });
    const [ isleague, iscup, iscircuit ] = parseCompType( competition.Comptype.name );

    let compobj: League | Cup | Minor;

    if( isleague ) {
      compobj = League.restore( competition.data );
    } else if( iscup ) {
      compobj = Cup.restore( competition.data );
    } else if( iscircuit ) {
      compobj = Minor.restore( competition.data );
    }

    // record match results
    const matches = groupedMatches[ competitionId ];
    const matchresults = matches.map( match => recordMatchItem( match, compobj, [ isleague, iscup, iscircuit ] ) );
    const genNewMatches = matchresults.includes( true );

    // do we need to generate new matchdays?
    if( genNewMatches && !compobj.isDone() ) {
      if( isleague && compobj.startPostSeason() ) {
        ( compobj as League ).divisions.forEach( d => d.promotionConferences.forEach( dd => genMappool( dd.duelObj.rounds() ) ) );
      }

      if( iscircuit ) {
        const currStage: Stage = compobj.getCurrentStage();

        // do we need to start the playoffs?
        if( currStage.playoffs && currStage.isGroupStageDone() && !currStage.duelObj && currStage.startPlayoffs() ) {
          genMappool( currStage.duelObj.rounds() );
        } else {
          genMappool( currStage.groupObj.rounds() );
        }
      }

      competition.data = compobj.save();
      await genMatchdays( competition );
    }

    // league post-matchday checks
    if( isleague && compobj.isDone() ) {
      compobj.endPostSeason();
      compobj.end();
    }

    competition.data = compobj.save();
    await competition.save();
    return Promise.resolve( genNewMatches );
  }));
}


/**
 * Generate the competitions after initial registration.
 */

export async function genAllComps() {
  const compdefs = await Models.Compdef.findAll({ include: [ 'Continents', 'Comptype' ] });
  const profile = await Models.Profile.getActiveProfile();
  return Promise.all( compdefs.map( async compdef => {
    // get the regions specified by the competition
    const regions = await Models.Continent.findAll({
      where: { id: compdef.Continents?.map( c => c.id ) || [] }
    });

    // save a competition per region
    if( regions && regions.length > 0 ) {
      return Promise.all( regions.map( region => genSingleComp( compdef, profile, compdefs, region ) ) );
    }

    // if no regions, this is an international competition
    return genSingleComp( compdef, profile, compdefs );
  }));
}


/**
 * Adds the user's team to competitions
 */

export async function assignUserCompetitions() {
  // grab competitions within same region as the user
  const profile = await Models.Profile.getActiveProfile();
  const region = profile.Team.Country.Continent;
  const competitions = await Models.Competition.findAll({
    include: [
      { model: Models.Comptype },
      { model: Models.Team },
      {
        model: Models.Continent,
        where: { id: region.id }
      },
    ]
  });

  // add user's team to each applicable competition
  return competitions.map( competition => addTeamToCompetition( competition, profile.Team ) );
}
