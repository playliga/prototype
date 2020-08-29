import probable from 'probable';
import { random } from 'lodash';


const SCORE_LOSER_LOW = 0;
const SCORE_LOSER_HIGH = 14;


export default function( team1: any, team2: any ) {
  // use probability to determine a winner
  // calculate weight based off of tier
  const ptable = probable.createTableFromSizes([
    [ team1.tier, team1.id ],
    [ team2.tier, team2.id ],
  ]);

  // who won?
  const winner = ptable.roll();
  const score_winner = 16;
  const score_loser = random( SCORE_LOSER_LOW, SCORE_LOSER_HIGH );

  // aaaand we have a winner!
  return [
    winner === team1.id ? score_winner : score_loser,
    winner === team2.id ? score_winner : score_loser,
  ];
}
