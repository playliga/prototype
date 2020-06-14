import { put, takeEvery } from 'redux-saga/effects';
import * as IPCRouting from 'shared/ipc-routing';
import IpcService from 'renderer/lib/ipc-service';
import * as EmailTypes from './types';
import * as emailActions from './actions';


function* findAll() {
  const payload = yield IpcService.send( IPCRouting.Database.GENERIC, {
    params: {
      model: 'Email',
      method: 'findAll',
      args: {
        include: [{ all: true }],
        order: [[ 'sentAt', 'DESC' ]]
      }
    }
  });

  yield put(
    emailActions.findAllFinish( payload )
  );
}


function* update( action: EmailTypes.EmailActionTypes ) {
  // bail if actiontype is not an
  // update to make ts happy
  if( action.type !== EmailTypes.UPDATE ) {
    return;
  }

  yield IpcService.send( IPCRouting.Database.UPDATE, {
    params: {
      model: 'Email',
      args: {
        id: action.payload.id,
        data: action.payload
      }
    }
  });
  yield put(
    emailActions.updateFinish( action.payload )
  );
}


export default function* watch() {
  yield takeEvery(
    EmailTypes.FINDALL,
    findAll
  );

  yield takeEvery(
    EmailTypes.UPDATE,
    update
  );
}
