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


function* updateSquadMember( action: ProfileTypes.ProfileActionTypes ) {
  const payload = yield IpcService.send( IPCRouting.Database.UPDATE, {
    params: {
      model: 'Player',
      args: {
        id: action.payload.id,
        data: action.payload
      }
    }
  });

  yield put(
    profileActions.updateSquadMemberFinish( payload )
  );
}


export default function* watch() {
  yield takeEvery(
    [ ProfileTypes.FIND, ProfileTypes.CALENDAR_FINISH ],
    find
  );

  yield takeEvery(
    ProfileTypes.UPDATE_SQUAD_MEMBER,
    updateSquadMember
  );
}
