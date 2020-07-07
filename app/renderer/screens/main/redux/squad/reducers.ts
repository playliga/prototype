import * as SquadTypes from './types';


const initialState: SquadTypes.SquadState = {
  loading: false,
  data: []
};


export default function emailReducer(
  state = initialState,
  action: SquadTypes.SquadActionTypes
): SquadTypes.SquadState {
  switch( action.type ) {
    case SquadTypes.FIND:
    case SquadTypes.TOGGLESTARTER:
      return {
        ...state,
        loading: true
      };
    case SquadTypes.FIND_FINISH:
      return {
        ...state,
        loading: false,
        data: action.payload
      };
    case SquadTypes.TOGGLESTARTER_FINISH:
      return {
        ...state,
        loading: false,
        data: state.data.map( ( p: any ) => {
          // this isn't the item we care about - keep it as-is
          if( p.id !== action.payload.id ) {
            return p;
          }

          return {
            ...p,
            ...action.payload
          };
        })
      };
    default:
      return state;
  }
}
