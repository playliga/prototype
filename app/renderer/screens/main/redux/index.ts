import { createStore, applyMiddleware, combineReducers } from 'redux';
import { all } from 'redux-saga/effects';
import createSagaMiddleware from 'redux-saga';
import thunk from 'redux-thunk';
import emailsReducers from './emails/reducers';
import profileReducers from './profile/reducers';
import emailsSagas from './emails/sagas';
import profileSagas from './profile/sagas';


// application reducers
const reducers = combineReducers({
  emails: emailsReducers,
  profile: profileReducers,
});


// application sagas
function* sagas() {
  yield all([
    emailsSagas(),
    profileSagas()
  ]);
}


// create and apply saga middleware
const sagaMiddleware = createSagaMiddleware();

const store = createStore(
  reducers,
  applyMiddleware( thunk, sagaMiddleware )
);


// run the root saga
sagaMiddleware.run( sagas );


// default method exposes the configured redux store
export default function configureRedux() {
  return store;
}
