import moment from 'moment';
import * as ProfileTypes from './types';


const initialState: ProfileTypes.ProfileState = {
  loading: false,
  data: {
    id: 0,
    currentDate: moment()
  },
};


export default function emailReducer(
  state = initialState,
  action: ProfileTypes.ProfileActionTypes
): ProfileTypes.ProfileState {
  switch( action.type ) {
    case ProfileTypes.FIND:
      return {
        ...state,
        loading: true
      };
    case ProfileTypes.FIND_FINISH:
      return {
        ...state,
        loading: false,
        data: action.payload
      };
    default:
      return state;
  }
}
