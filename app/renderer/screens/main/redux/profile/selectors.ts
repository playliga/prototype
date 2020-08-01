import { createSelector } from 'reselect';
import { ProfileState } from './types';


export const getSquad = createSelector(
  ( state: any ) => state.profile,        // which part of state to select
  ( profile: ProfileState ) => {          // manipulate that state
    return profile
      .data
      .Team
      .Players
      .filter( p => p.id !== profile.data.Player.id )
    ;
  }
);
