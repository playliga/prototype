import { IterableObject } from './types';


export const ActionQueueTypes = {
  SEND_EMAIL: 'SEND_EMAIL',
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
