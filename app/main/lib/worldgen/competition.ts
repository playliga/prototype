import moment from 'moment';
import * as Models from 'main/database/models';
import { random } from 'lodash';
import { ActionQueueTypes, CompTypes } from 'shared/enums';
import { League } from 'main/lib/league';
import Application from 'main/constants/application';


/**
 * Start a competition.
 */

export function start( comp: Models.Competition ) {
  const league = League.restore( comp.data );
  league.start();
  return comp.update({ data: league });
}


/**
 * Generates matchdays for a competition.
 */

function getMatchdayWeekday( type: string, date: moment.Moment ) {
  switch( type ) {
    case CompTypes.LEAGUE: {
      const day = random( 0, Application.MATCHDAYS_LEAGUE.length - 1 );
      return date.weekday( Application.MATCHDAYS_LEAGUE[ day ] );
    }
    default:
      return;
  }
}


export async function generateMatchdays( comp: Models.Competition ) {
  // get user's profile
  const profile = await Models.Profile.getActiveProfile();

  // bail if the user's team is not competing in this competition
  const joined = profile
    .Team
    .Competitions
    .findIndex( c => c.id === comp.id )
  > -1;

  if( !joined ) {
    return Promise.resolve();
  }

  // get their team's division, conference, and seednum
  const leagueobj = League.restore( comp.data );
  const divobj = leagueobj.getDivisionByCompetitorId( profile.Team.id );
  const [ conf, seednum ] = divobj.getCompetitorConferenceAndSeedNumById( profile.Team.id );
  const matches = conf.groupObj.upcoming( seednum );

  // generate their matchdays which tie into the actionqueue db table
  const matchdays = matches.map( ( match, idx ) => ({
    type: ActionQueueTypes.MATCHDAY,
    actionDate: getMatchdayWeekday(
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

  // bulk insert into the actionqueue as matchdays
  return Models.ActionQueue.bulkCreate( matchdays );
}


/**
 * Generate the competitions after initial registration.
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
      actionDate: moment().add( compdef.startOffset, 'days' ),
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


export async function genAllComps() {
  const compdefs = await Models.Compdef.findAll({
    include: [ 'Continents', 'Comptype' ],
  });
  const profile = await Models.Profile.getActiveProfile();
  return compdefs.map( c => genSingleComp( c, profile ) );
}
