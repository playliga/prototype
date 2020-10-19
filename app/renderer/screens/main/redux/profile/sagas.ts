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
        // @ts-ignore
        id: action.payload.id,
        // @ts-ignore
        data: action.payload
      }
    }
  });

  yield put(
    profileActions.updateSquadMemberFinish( payload )
  );
}


function* updateSettings( action: ProfileTypes.ProfileActionTypes ) {
  // update the profile
  yield IpcService.send( IPCRouting.Database.UPDATE, {
    params: {
      model: 'Profile',
      args: {
        // @ts-ignore
        id: action.payload.id,
        // @ts-ignore
        data: { settings: action.payload }
      }
    }
  });

  // fetch the new data
  yield find();
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

  yield takeEvery(
    ProfileTypes.UPDATE_SETTINGS,
    updateSettings
  );
}
