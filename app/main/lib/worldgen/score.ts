import log from 'electron-log';
import probable from 'probable';
import Tiers from 'shared/tiers';
import Application from 'main/constants/application';
import BotExp from 'main/lib/bot-exp';
import { random } from 'lodash';


const DRAW_ID = 'draw';
const SCORE_LOSER_LOW = 0;
const SCORE_LOSER_HIGH = 14;
const SCORE_DRAW = 15;


/**
 * Grab the team's skill level based
 * off of the players in their squad.
 */

function getPlayerSkillLevel( player: any ) {
  if( player.stats ) {
    const exp = new BotExp( player.stats );
    const [ tdx, tplidx ] = exp.getTierId();
    return Tiers[ tdx ].templates[ tplidx ].multiplier;
  }

  const templates = Tiers[ player.tier ].templates;
  const idx = random( 0, templates.length - 1 );
  return templates[ idx ].multiplier;
}


function getTeamSkillLevel( team: any ) {
  // just in case squad length is not met
  // default to the team's tier level
  if( team.Players.length < Application.SQUAD_MIN_LENGTH ) {
    const templates = Tiers[ team.tier ].templates;
    const idx = random( 0, templates.length - 1 );
    const tpl = templates[ idx ];
    return tpl.multiplier * Application.SQUAD_MIN_LENGTH;
  }

  const players = team.Players as any[];
  return players
    .map( getPlayerSkillLevel )
    .slice( 0, Application.SQUAD_MIN_LENGTH )
    .reduce( ( a, b ) => a + b )
  ;
}


export default function( team1: any, team2: any, allowdraw = false, debug = false ) {
  // calculate probability weight for teams
  let w_team1 = 0;
  let w_team2 = 0;

  if( team1.Players && team1.Players.length > 0 ) {
    w_team1 += getTeamSkillLevel( team1 );
  } else {
    w_team1 += 1;
  }

  if( team2.Players && team2.Players.length > 0 ) {
    w_team2 += getTeamSkillLevel( team2 );
  } else {
    w_team2 += 1;
  }

  // use probability to determine a winner
  // calculate weight based off of tier
  const rawtable = [
    [ w_team1, team1.id ],
    [ w_team2, team2.id ],
  ];

  // do we allow draws? if so, the chance to
  // draw is equal to the lower tier team
  if( allowdraw ) {
    const lowesttier = team1.tier > team2.tier ? team2.tier : team1.tier;
    const [ template ] = Tiers[ lowesttier ].templates;
    rawtable.push([ template.multiplier * Application.SQUAD_MIN_LENGTH, DRAW_ID ]);
  }

  if( debug ) {
    log.debug( 'Generating score with probability weights: ', rawtable );
  }

  // generate a score!
  const ptable = probable.createTableFromSizes( rawtable );
  const winner = ptable.roll();

  // was it a draw?
  if( allowdraw && winner === DRAW_ID ) {
    return [ SCORE_DRAW, SCORE_DRAW ];
  }

  // return the winner.
  const score_winner = 16;
  const score_loser = random( SCORE_LOSER_LOW, SCORE_LOSER_HIGH );
  return [
    winner === team1.id ? score_winner : score_loser,
    winner === team2.id ? score_winner : score_loser,
  ];
}
