import * as EmailTypes from './types';


const initialState: EmailTypes.EmailState = {
  loading: false,
  data: [],
};


export default function emailReducer(
  state = initialState,
  action: EmailTypes.EmailActionTypes
): EmailTypes.EmailState {
  switch( action.type ) {
    case EmailTypes.FINDALL:
      return {
        ...state,
        loading: true
      };
    case EmailTypes.FINDALL_FINISH:
      return {
        ...state,
        loading: false,
        data: action.payload
      };
    case EmailTypes.ADD_FINISH:
      return {
        ...state,
        loading: false,
        data: [
          ...state.data,
          action.payload
        ]
      };
    case EmailTypes.UPDATE:
      return {
        ...state,
        loading: true,
      };
    case EmailTypes.UPDATE_FINISH:
      return {
        ...state,
        loading: false,
        data: state.data.map( email => {
          // this isn't the item we care about - keep it as-is
          if( email.id !== action.payload.id ) {
            return email;
          }

          return {
            ...email,
            ...action.payload
          };
        })
      };
    default:
      return state;
  }
}
