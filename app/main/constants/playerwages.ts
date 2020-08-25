import { IterableObject } from 'shared/types';


const PlayerWages: IterableObject<any> = {
  TIER_0: {
    TOP_PERCENT   : 20,
    TOP_WAGE_HIGH : 20000,
    TOP_WAGE_LOW  : 15000,
    TOP_MODIFIER  : 6,
    MID_PERCENT   : 80,
    MID_WAGE_HIGH : 15000,
    MID_WAGE_LOW  : 10000,
    MID_MODIFIER  : 4,
    BOT_PERCENT   : 20,
    BOT_WAGE_HIGH : 10000,
    BOT_WAGE_LOW  : 5000,
    BOT_MODIFIER  : 2,
  },
  TIER_1: {
    TOP_PERCENT   : 20,
    TOP_WAGE_HIGH : 5000,
    TOP_WAGE_LOW  : 1000,
    TOP_MODIFIER  : 2,
  }
};


export default PlayerWages;
