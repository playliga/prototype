import { put, takeEvery } from 'redux-saga/effects';
import IpcService from 'renderer/lib/ipc-service';
import * as IPCRouting from 'shared/ipc-routing';
import * as ProfileTypes from './types';
import * as profileActions from './actions';


function* find() {
  const payload = yield IpcService.send( IPCRouting.Database.PROFILE_GET, {} );

  yield put(
    profileActions.findFinish( payload )
  );
}


export default function* watch() {
  yield takeEvery(
    ProfileTypes.FIND,
    find
  );
}
