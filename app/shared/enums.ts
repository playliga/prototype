export const ActionQueueTypes = {
  ENDSEASON_PRIZE_MONEY   : 'ENDSEASON_PRIZE_MONEY',
  ENDSEASON_REPORT        : 'ENDSEASON_REPORT',
  ENDSEASON_RESULTS       : 'ENDSEASON_RESULTS',
  MATCHDAY                : 'MATCHDAY',
  MATCHDAY_NPC            : 'MATCHDAY_NPC',
  SEND_EMAIL              : 'SEND_EMAIL',
  START_SEASON            : 'START_SEASON',
  START_COMP              : 'START_COMP',
  TRANSFER_MOVE           : 'TRANSFER_MOVE',
  TRANSFER_OFFER_RESPONSE : 'TRANSFER_OFFER_RESPONSE',
};


export const OfferStatus = {
  ACCEPTED  : 'accepted',
  PENDING   : 'pending',
  REJECTED  : 'rejected',
};


export const CompTypes = {
  CIRCUIT_MAJOR     : 'circuit:major',
  CIRCUIT_MINOR     : 'circuit:minor',
  LEAGUE            : 'league',
  LEAGUE_CUP        : 'leaguecup',
};


export const CompTypePrettyNames = {
  [CompTypes.CIRCUIT_MAJOR] : 'Global Circuit / Major',
  [CompTypes.CIRCUIT_MINOR] : 'Global Circuit / Minors',
  [CompTypes.LEAGUE]        : 'Leagues',
  [CompTypes.LEAGUE_CUP]    : 'Cups',
};


export const AutofillAction = {
  EXCLUDE : 'exclude',
  INVITE  : 'invite',
  OPEN    : 'open',
};


/**
 * Certain stats are better when you
 * subtract instead of add to them.
 */

export const StatModifiers = {
  SUBTRACT: [ 'reactionTime', 'attackDelay' ],
};
