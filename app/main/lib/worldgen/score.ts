import probable from 'probable';
import { random } from 'lodash';
import Tiers from 'shared/tiers';


const DRAW_ID = 'draw';
const SCORE_LOSER_LOW = 0;
const SCORE_LOSER_HIGH = 14;
const SCORE_DRAW = 15;


/**
 * Grab the team's skill level based
 * off of the players in their squad.
 */

function getTeamSkillLevel( players: any[] ) {
  return players
    .map( p => Tiers[ p.tier ].multiplier )
    .reduce( ( a, b ) => a + b )
  ;
}


/**
 * Generate a team's score. In the event that no
 * draws are allowed, an optional param can
 * be passed specifying the score to avoid.
 */

function genScore( avoidscore: number = null ): number {
  // generate the score
  const score = random( SCORE_LOSER_LOW, SCORE_LOSER_HIGH );

  if( avoidscore && score === avoidscore ) {
    return genScore( avoidscore );
  }

  return score;
}


export default function( team1: any, team2: any, allowdraw = false ) {
  // calculate probability weight for teams
  let w_team1 = 0;
  let w_team2 = 0;

  if( team1.Players && team1.Players.length > 0 ) {
    w_team1 += getTeamSkillLevel( team1.Players );
  } else {
    w_team1 += 1;
  }

  if( team2.Players && team2.Players.length > 0 ) {
    w_team2 += getTeamSkillLevel( team2.Players );
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
    rawtable.push([ Tiers[ lowesttier ].multiplier, DRAW_ID ]);
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
  const score_loser = genScore( allowdraw ? null : score_winner );
  return [
    winner === team1.id ? score_winner : score_loser,
    winner === team2.id ? score_winner : score_loser,
  ];
}
