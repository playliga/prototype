import moment from 'moment';
import * as Models from 'main/database/models';
import { ActionQueueTypes } from 'shared/enums';
import { League } from 'main/lib/league';


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
