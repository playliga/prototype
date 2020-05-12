import { createSelector } from 'reselect';
import { EmailState } from './types';


export const getUnread = createSelector(
  ( state: any ) => state.emails, // which part of state to select
  ( emails: EmailState ) => {     // manipulate that state
    if( emails.data.length > 0 ) {
      return emails.data.filter( e => e.read === false ).length;
    }

    return 0;
  }
);
