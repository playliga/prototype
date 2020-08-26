import moment from 'moment';
import * as Models from 'main/database/models';
import { random, flattenDeep, shuffle } from 'lodash';
import { ActionQueueTypes, CompTypes } from 'shared/enums';
import { League } from 'main/lib/league';
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
    case CompTypes.LEAGUE: {
      const day = random( 0, Application.MATCHDAYS_LEAGUE.length - 1 );
      return date.weekday( Application.MATCHDAYS_LEAGUE[ day ] );
    }
    default:
      return;
  }
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

    // build the league object
    const leagueobj = new League( compdef.name );

    compdef.tiers.forEach( ( tier, tdx ) => {
      const div = leagueobj.addDivision( tier.name, tier.minlen, tier.confsize );
      const tierteams = teams.filter( t => t.tier === tdx );
      const competitors = tierteams
        .slice( 0, tier.minlen )
        .map( t => ({ id: t.id, name: t.name }) )
      ;
      div.meetTwice = compdef.meetTwice;
      div.addCompetitors( competitors );
    });

    // build the competition
    const comp = Models.Competition.build({ data: leagueobj });
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
  const league = League.restore( comp.data );

  // shuffle divisions before starting
  league.divisions.forEach( divobj => {
    divobj.competitors = shuffle( divobj.competitors );
  });

  league.start();
  return comp.update({ data: league });
}


/**
 * Generates matchdays for a competition
 */

export async function genMatchdays( comp: Models.Competition ) {
  // init the league object
  const leagueobj = League.restore( comp.data );

  // if the user joined, grab their conf+seed numbers
  const profile = await Models.Profile.getActiveProfile();
  const joined = didJoin( profile.Team, comp );

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
      return conf.groupObj.rounds().map( ( rnd, idx ) => {
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
