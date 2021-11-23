import { createSelector } from 'reselect';
import { OfferStatus } from 'shared/enums';
import { ProfileState } from './types';


export const getSquad = createSelector(
  ( state: any ) => state.profile,        // which part of state to select
  ( profile: ProfileState ) => {          // manipulate that state
    return profile
      .data
      .Team
      .Players
      .filter( ( p: any ) => p.id !== profile.data.Player.id )
    ;
  }
);


export const getOffers = createSelector(
  ( state: any ) => state.profile,
  ( profile: ProfileState ) => {
    if( !profile.data ) {
      return false;
    }

    return profile
      .data
      .Team
      .Players
      .filter( ( p: any ) => p.TransferOffers.length > 0 && p.TransferOffers.some( ( t: any ) => t.status === OfferStatus.PENDING ) )
      .reduce( ( total: number, current: any ) => total + current.TransferOffers.length, 0 )
    ;
  }
);
