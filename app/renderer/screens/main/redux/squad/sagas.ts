import { put, takeEvery } from 'redux-saga/effects';
import IpcService from 'renderer/lib/ipc-service';
import * as IPCRouting from 'shared/ipc-routing';
import * as SquadTypes from './types';
import * as squadActions from './actions';


function* find( action: SquadTypes.SquadActionTypes ) {
  const params = {
    model: 'Player',
    method: 'findAll',
    args: {
      include: [{ all: true }],
      where: { teamId: action.payload },
    }
  };

  const payload = yield IpcService.send(
    IPCRouting.Database.GENERIC,
    { params }
  );

  yield put(
    squadActions.findFinish( payload )
  );
}


function* toggleStarter( action: SquadTypes.SquadActionTypes ) {
  const payload = yield IpcService.send( IPCRouting.Database.UPDATE, {
    params: {
      model: 'Player',
      args: {
        id: action.payload.id,
        data: { starter: !action.payload.starter }
      }
    }
  });

  yield put(
    squadActions.toggleStarterFinish( payload )
  );
}


export default function* watch() {
  yield takeEvery(
    SquadTypes.FIND,
    find
  );

  yield takeEvery(
    SquadTypes.TOGGLESTARTER,
    toggleStarter
  );
}
