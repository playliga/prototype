import { ipcMain, IpcMainEvent } from 'electron';
import { IpcRequest } from 'shared/types';
import * as IPCRouting from 'shared/ipc-routing';
import * as Models from 'main/database/models';
import moment from 'moment';
import Worldgen from 'main/lib/worldgen';
import Application from 'main/constants/application';


interface LoopParams {
  max?: number;
}


async function handler( evt: IpcMainEvent, request: IpcRequest<LoopParams> ) {
  // bail if no response channel provided
  if( !request.responsechannel ) {
    return;
  }

  // grab current calendar loop settings settings
  const profile = await Models.Profile.getActiveProfile();
  const sim_loop_iterations = profile.settings.sim_loop_iterations || Application.CALENDAR_LOOP_MAX_ITERATIONS;
  const sim_loop_unit = profile.settings.sim_loop_multiplier || Application.CALENDAR_LOOP_UNIT_MULTIPLIERS[ 0 ];
  const sim_loop_length_days = request.params?.max || moment.duration( sim_loop_iterations, sim_loop_unit ).asDays();

  // begin the calendar loop
  await Worldgen.Calendar.loop( sim_loop_length_days, profile.settings.sim_ignore_bail );
  evt.sender.send( request.responsechannel, null );
}


function stop() {
  Worldgen.Calendar.loop_stop();
}


export default function() {
  ipcMain.on( IPCRouting.Worldgen.CALENDAR_LOOP, handler );
  ipcMain.on( IPCRouting.Worldgen.CALENDAR_LOOP_STOP, stop );
}
