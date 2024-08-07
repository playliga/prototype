/**
 * Calendar IPC handlers.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { add, addDays, differenceInDays, format } from 'date-fns';
import { Prisma, Calendar } from '@prisma/client';
import { DatabaseClient, Engine, WindowManager, Worldgen } from '@liga/backend/lib';
import { Constants } from '@liga/shared';

/**
 * Engine loop handler.
 *
 * Runs at the start of every engine loop tick.
 *
 * @function
 */
async function onTickStart() {
  Engine.Runtime.Instance.log.info(
    'Running %s middleware...',
    Engine.MiddlewareType.TICK_START.toUpperCase(),
  );

  // grab today's calendar entries
  const profile = await DatabaseClient.prisma.profile.findFirst();
  Engine.Runtime.Instance.input = await DatabaseClient.prisma.calendar.findMany({
    where: { date: profile.date.toISOString(), completed: false },
  });

  Engine.Runtime.Instance.log.info(
    "Today's date is: %s",
    format(profile.date, Constants.Application.CALENDAR_DATE_FORMAT),
  );
  Engine.Runtime.Instance.log.info('%d items to run.', Engine.Runtime.Instance.input.length);

  return Promise.resolve();
}

/**
 * Engine loop handler.
 *
 * Runs at the end of every engine loop tick.
 *
 * @param input   The input data.
 * @param status  The status of the engine loop.
 * @function
 */
async function onTickEnd(input: Calendar[], status?: Engine.LoopStatus) {
  Engine.Runtime.Instance.log.info(
    'Running %s middleware...',
    Engine.MiddlewareType.TICK_END.toUpperCase(),
  );

  // mark today's calendar entries as completed
  await Promise.all(
    input.map((calendar) =>
      DatabaseClient.prisma.calendar.update({
        where: { id: calendar.id },
        data: { completed: true },
      }),
    ),
  );

  // bail if loop was terminated early
  if (status === Engine.LoopStatus.TERMINATED) {
    Engine.Runtime.Instance.log.info('Stopping...');
    return Promise.resolve();
  }

  // record today's match results
  await Worldgen.recordMatchResults();

  // bump the calendar date by one day
  let profile = await DatabaseClient.prisma.profile.findFirst();
  profile = await DatabaseClient.prisma.profile.update({
    where: { id: profile.id },
    data: {
      date: addDays(profile.date, 1).toISOString(),
    },
  });

  // send the updated profile object to the renderer
  const mainWindow = WindowManager.get(Constants.WindowIdentifier.Main, false)?.webContents;

  if (mainWindow) {
    mainWindow.send(Constants.IPCRoute.PROFILES_CURRENT, profile);
  }

  return Promise.resolve();
}

/**
 * Engine loop handler.
 *
 * Runs at the very end of an engine loop cycle.
 *
 * @function
 */
function onLoopFinish() {
  Engine.Runtime.Instance.log.info(
    'Running %s middleware...',
    Engine.MiddlewareType.LOOP_FINISH.toUpperCase(),
  );

  return Worldgen.sendUserTransferOffer();
}

/**
 * Register engine loop middleware and IPC event handlers.
 *
 * @function
 */
export default function () {
  // set up the engine loop built-ins
  Engine.Runtime.Instance.register(Engine.MiddlewareType.TICK_START, onTickStart);
  Engine.Runtime.Instance.register(Engine.MiddlewareType.TICK_END, onTickEnd);
  Engine.Runtime.Instance.register(Engine.MiddlewareType.LOOP_FINISH, onLoopFinish);

  // set up engine loop generic middleware
  Engine.Runtime.Instance.register(
    Constants.CalendarEntry.COMPETITION_START,
    Worldgen.onCompetitionStart,
  );
  Engine.Runtime.Instance.register(Constants.CalendarEntry.MATCHDAY_NPC, Worldgen.onMatchdayNPC);
  Engine.Runtime.Instance.register(Constants.CalendarEntry.MATCHDAY_USER, Worldgen.onMatchdayUser);
  Engine.Runtime.Instance.register(Constants.CalendarEntry.SEASON_START, Worldgen.onSeasonStart);
  Engine.Runtime.Instance.register(
    Constants.CalendarEntry.TRANSFER_PARSE,
    Worldgen.onTransferOffer,
  );

  // set up the ipc handlers
  ipcMain.handle(Constants.IPCRoute.CALENDAR_CREATE, (_, data: Prisma.CalendarCreateInput) =>
    DatabaseClient.prisma.calendar.create({ data }),
  );
  ipcMain.handle(Constants.IPCRoute.CALENDAR_START, async (_, max?: number) => {
    // load user settings
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const settings = JSON.parse(profile.settings) as typeof Constants.Settings;

    // on first runs we skip to the first competition
    // start date which is the minor open qualifiers
    if (!(await DatabaseClient.prisma.competition.count())) {
      const circuit = await DatabaseClient.prisma.league.findFirst({
        where: {
          slug: Constants.LeagueSlug.ESPORTS_CIRCUIT,
        },
      });

      Engine.Runtime.Instance.log.debug(
        'First run detected. Skipping %d days...',
        circuit.startOffsetDays,
      );

      return Engine.Runtime.Instance.start(circuit.startOffsetDays + 1, true);
    }

    // bail early if we know how many iterations to loop through
    if (max) {
      return Engine.Runtime.Instance.start(max, settings.calendar.ignoreExits);
    }

    // otherwise figure out how many days to iterate
    const from = profile.date;
    const to = add(from, { [settings.calendar.unit]: settings.calendar.maxIterations });
    return Engine.Runtime.Instance.start(differenceInDays(to, from), settings.calendar.ignoreExits);
  });
  ipcMain.handle(Constants.IPCRoute.CALENDAR_SIM, async () => {
    // grab the calendar entry for today's user matchday
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const entry = await DatabaseClient.prisma.calendar.findFirst({
      where: {
        date: profile.date.toISOString(),
        type: Constants.CalendarEntry.MATCHDAY_USER,
      },
    });

    Engine.Runtime.Instance.log.debug(
      'Received request to sim for match(payload=%s) on %s',
      entry.payload,
      format(entry.date, Constants.Application.CALENDAR_DATE_FORMAT),
    );

    // sim the match using worldgen
    return Worldgen.onMatchdayNPC(entry);
  });
}
