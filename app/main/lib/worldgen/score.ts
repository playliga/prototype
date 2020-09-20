import probable from 'probable';
import { random } from 'lodash';
import Tiers from 'shared/tiers';


const DRAW_ID = 'draw';
const SCORE_LOSER_LOW = 0;
const SCORE_LOSER_HIGH = 14;
const SCORE_DRAW = 15;


export default function( team1: any, team2: any, allowdraw = false ) {
  // use probability to determine a winner
  // calculate weight based off of tier
  const rawtable = [
    [ Tiers[ team1.tier ].multiplier, team1.id ],
    [ Tiers[ team2.tier ].multiplier, team2.id ],
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
  const score_loser = random( SCORE_LOSER_LOW, SCORE_LOSER_HIGH );
  return [
    winner === team1.id ? score_winner : score_loser,
    winner === team2.id ? score_winner : score_loser,
  ];
}
