import { put, takeEvery } from 'redux-saga/effects';
import { snooze } from 'shared/util';
import IpcService from 'renderer/lib/ipc-service';
import * as IPCRouting from 'shared/ipc-routing';
import * as ProfileTypes from './types';
import * as profileActions from './actions';


function* find(): Generator<any> {
  const payload: any = yield IpcService.send( IPCRouting.Database.PROFILE_GET, {} );

  yield put(
    profileActions.findFinish( payload )
  );
}


function* trainSquad( action: ProfileTypes.ProfileActionTypes ) {
  // @note: faux loading to reduce jarring loading indicator
  yield snooze( 2000 );

  // train the squad and fetch the new data
  yield IpcService.send( IPCRouting.Database.PROFILE_SQUAD_TRAIN, {
    // @ts-ignore
    params: { ids: action.payload }
  });

  yield find();
}


function* updateSquadMember( action: ProfileTypes.ProfileActionTypes ): Generator<any> {
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


function* updateSettings( action: ProfileTypes.ProfileActionTypes ): Generator<any> {
  // grab existing profile to merge with updated settings
  const data = yield IpcService.send( IPCRouting.Database.PROFILE_GET );

  // update the profile
  yield IpcService.send( IPCRouting.Database.UPDATE, {
    params: {
      model: 'Profile',
      args: {
        // @ts-ignore
        id: action.payload.id,
        data: {
          // @ts-ignore
          settings: { ...data.settings, ...action.payload }
        }
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
    ProfileTypes.TRAINSQUAD,
    trainSquad
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
