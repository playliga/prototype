import { random } from 'lodash';
import { Op } from 'sequelize';
import * as Models from 'main/database/models';
import { League } from 'main/lib/league';
import ScreenManager from 'main/lib/screen-manager';


/**
 * Assign manager and assistant managers to the user's team.
 */

export async function assignManagers() {
  // load profile and specific associations
  const profile = await Models.Profile.findOne({
    include: [{
      model: Models.Team,
      include: [{
        model: Models.Country,
        include: [ 'Continent' ]
      }]
    }]
  });

  if( !profile ) {
    return Promise.reject();
  }

  // load the user's team
  const team = profile.Team;

  if( !team ) {
    return Promise.reject();
  }

  // get all personas
  let personas = await Models.Persona.findAll({
    where: { teamId: null },
    include: [
      'PersonaType',
      {
        model: Models.Country,
        include: [ 'Continent' ]
      }
    ]
  });

  // filter personas by user team's region
  personas = personas.filter( p => p.Country?.Continent?.id === team.Country?.Continent?.id );

  // try to filter by country too
  const countrymen = personas.filter( p => p.Country?.code === team.Country?.code );

  if( countrymen.length > 0 ) {
    personas = countrymen;
  }

  // group personas by type
  const managers = personas.filter( p => p.PersonaType?.name === 'Manager' );
  const asstmanagers = personas.filter( p => p.PersonaType?.name === 'Assistant Manager' );

  // pick a random manager+asst manager combo
  const randmanager = managers[ random( 0, managers.length - 1 ) ];
  const randasstmanager = asstmanagers[ random( 0, asstmanagers.length - 1 ) ];

  // set associations and send back as a promise
  return Promise.all([
    randmanager.setTeam( team ),
    randasstmanager.setTeam( team ),
  ]);
}


/**
 * Generate the competitions after initial registration.
 */

async function genSingleComp( compdef: Models.Compdef ) {
  // get the regions
  const regionids = compdef.Continents?.map( c => c.id ) || [];
  const regions = await Models.Continent.findAll({
    where: { id: regionids }
  });

  // bail if no regions
  if( !regions ) {
    return Promise.resolve();
  }

  return Promise.all( regions.map( async region => {
    const teams = await Models.Team.findByRegionId( region.id );
    const leagueobj = new League( compdef.name );

    // add teams to the competition tiers
    compdef.tiers.forEach( ( tier, tdx ) => {
      const div = leagueobj.addDivision( tier.name, tier.minlen, tier.confsize );
      const tierteams = teams.filter( t => t.tier === tdx );
      div.addCompetitors( tierteams.slice( 0, tier.minlen ).map( t => t.id.toString() ) );
    });

    // build the competition
    const comp = Models.Competition.build({ data: leagueobj });
    await comp.save();

    // save its associations
    return Promise.all([
      comp.setCompdef( compdef ),
      comp.setContinents([ region ]),
    ]);
  }));
}


export async function genAllComps() {
  const compdefs = await Models.Compdef.findAll({
    include: [ 'Continents' ],
  });
  return compdefs.map( genSingleComp );
}


/**
 * Generate wages based off of league positions
 *
 * Tier 0
 * ------
 * - Top 5      : $15-20k/month
 * - Mid-table  : $10-15k/month
 * - Bottom     : $5k-10k/month
 *
 * Tier 1
 * ------
 * - Top 5      : $1k-5k/month
 */
export async function calculateWages() {
  const players = await Models.Player.findAll({
    where: {
      tier: {
        [Op.lte]: 1
      }
    }
  });
  console.log( players.length );
  return Promise.resolve();
}


/**
 * Intro e-mail sent by assistant manager.
 */

const INTROEMAIL_DELAY = 5000;
const INTROEMAIL_TARGET_SCREEN = '/screens/main';


async function delayedIntroEmail() {
  // get team and player from the saved profile
  const profile = await Models.Profile.findOne({ include: [{ all: true }] });
  const team = profile?.Team;
  const player = profile?.Player;

  // get the asst manager for the user's team
  const persona = await Models.Persona.findOne({
    where: { teamId: team?.id || 1 },
    include: [{
      model: Models.PersonaType,
      where: { name: 'Assistant Manager' }
    }]
  });

  if( !persona || !player ) {
    return;
  }

  const emailid = await Models.Email.send({
    from: persona,
    to: player,
    subject: 'Hey!',
    content: `
      Hi, ${player.alias}.

      My name is ${persona.fname} and I am your assistant manager. I just wanted to say hello and inform you that we should start looking for your starting squad.

      Without a squad we won't be able to compete in any competitions.
    `
  });

  const email = await Models.Email.findByPk( emailid, {
    include: [{ all: true }]
  });

  ScreenManager
    .getScreenById( INTROEMAIL_TARGET_SCREEN )
    .handle
    .webContents
    .send(
      '/worldgen/email/new',
      JSON.stringify( email )
    )
  ;
}


export function sendIntroEmail() {
  setTimeout( delayedIntroEmail, INTROEMAIL_DELAY );
}
