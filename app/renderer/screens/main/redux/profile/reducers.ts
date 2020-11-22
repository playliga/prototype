import * as ProfileTypes from './types';


const initialState: ProfileTypes.ProfileState = {
  loading: false,
  data: null
};


export default function emailReducer(
  state = initialState,
  action: ProfileTypes.ProfileActionTypes
): ProfileTypes.ProfileState {
  switch( action.type ) {
    case ProfileTypes.FIND:
    case ProfileTypes.TRAINSQUAD:
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
    case ProfileTypes.UPDATE_SQUAD_MEMBER_FINISH:
      return {
        ...state,
        loading: false,
        data: {
          ...state.data,
          Team: {
            ...state.data.Team,
            Players: state.data.Team.Players.map( ( p: any ) => {
              // this isn't the item we care about - keep it as-is
              if( p.id !== action.payload.id ) {
                return p;
              }

              return {
                ...p,
                ...action.payload
              };
            })
          }
        }
      };
    default:
      return state;
  }
}
