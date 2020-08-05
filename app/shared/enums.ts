import { IterableObject } from './types';


export const ActionQueueTypes = {
  MATCHDAY: 'MATCHDAY',
  SEND_EMAIL: 'SEND_EMAIL',
  START_COMP: 'START_COMP',
  TRANSFER_MOVE: 'TRANSFER_MOVE',
  TRANSFER_OFFER_RESPONSE: 'TRANSFER_OFFER_RESPONSE',
};


export const Tiers: IterableObject<string> = {
  0: 'Premier',
  1: 'Advanced',
  2: 'Main',
  3: 'Intermediate',
  4: 'Open'
};


export const OfferStatus = {
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REJECTED: 'rejected',
};


export const CompTypes = {
  CHAMPIONS_LEAGUE: 'championsleague',
  LEAGUE: 'league',
  LEAGUE_CUP: 'leaguecup',
};
