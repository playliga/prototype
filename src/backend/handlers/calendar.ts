/**
 * Calendar IPC handlers.
 *
 * @module
 */
import { dialog, ipcMain } from 'electron';
import { add, addDays, differenceInDays, format } from 'date-fns';
import { Prisma, Calendar } from '@prisma/client';
import { DatabaseClient, Engine, WindowManager, Worldgen } from '@liga/backend/lib';
import { Bot, Constants, Eagers, Util } from '@liga/shared';

/**
 * Prevents the main window from closing immediately and
 * instead warns the issue if they want to proceed.
 *
 * This helps mitigate issues with corrupted databases.
 *
 * @param event The event handler object.
 * @function
 */
async function disableClose(event: Electron.Event) {
  event.preventDefault();
  const mainWindow = WindowManager.get(Constants.WindowIdentifier.Main);
  const data = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    message: 'The calendar is still advancing. Exiting now may cause database corruption.',
    detail: 'Are you sure you want to continue and risk potential data loss?',
    buttons: ['Continue', 'Cancel'],
  });
  if (data.response === 0) {
    mainWindow.destroy();
  }
}

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
    Constants.CalendarEntry.SPONSORSHIP_PARSE,
    Worldgen.onSponsorshipOffer,
  );
  Engine.Runtime.Instance.register(
    Constants.CalendarEntry.SPONSORSHIP_PAYMENT,
    Worldgen.onSponsorshipPayment,
  );
  Engine.Runtime.Instance.register(
    Constants.CalendarEntry.TRANSFER_PARSE,
    Worldgen.onTransferOffer,
  );

  // set up the ipc handlers
  ipcMain.handle(Constants.IPCRoute.CALENDAR_CREATE, (_, data: Prisma.CalendarCreateInput) =>
    DatabaseClient.prisma.calendar.create({ data }),
  );
  ipcMain.handle(Constants.IPCRoute.CALENDAR_FIND, (_, query: Prisma.CalendarFindFirstArgs) =>
    DatabaseClient.prisma.calendar.findFirst(query),
  );
  ipcMain.handle(Constants.IPCRoute.CALENDAR_START, async (_, max?: number) => {
    // load user settings
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const settings = Util.loadSettings(profile.settings);

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

    // disable window interactivity while the calendar
    // advances to prevent database corruption and
    // also prevent the user from closing the app
    WindowManager.get(Constants.WindowIdentifier.Main).on('close', disableClose);
    WindowManager.disableMenu(Constants.WindowIdentifier.Main);

    // figure out how many days to iterate
    let days = max;

    if (!max) {
      const from = profile.date;
      const to = add(from, { [settings.calendar.unit]: settings.calendar.maxIterations });
      days = differenceInDays(to, from);
    }

    // start the calendar
    await Engine.Runtime.Instance.start(days, settings.calendar.ignoreExits);

    // re-enable the window and detach
    // the close event handler
    WindowManager.get(Constants.WindowIdentifier.Main).off('close', disableClose);
    WindowManager.enableMenu(Constants.WindowIdentifier.Main);
    return Promise.resolve();
  });
  ipcMain.handle(Constants.IPCRoute.CALENDAR_SIM, async () => {
    // grab the calendar entry for today's user matchday
    const profile = await DatabaseClient.prisma.profile.findFirst(Eagers.profile);
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
    await Worldgen.onMatchdayNPC(entry);

    // give training boosts to squad if they won
    const match = await DatabaseClient.prisma.match.findFirst({
      where: {
        id: Number(entry.payload),
      },
      include: Eagers.match.include,
    });
    const userTeam = match.competitors.find((competitor) => competitor.teamId === profile.teamId);

    if (userTeam.result === Constants.MatchResult.WIN) {
      const bonuses = [
        {
          id: -1,
          type: Constants.BonusType.SERVER,
          name: 'Win Bonus',
          stats: JSON.stringify({ skill: 2, agression: 2, reactionTime: 2, attackDelay: 2 }),
          cost: -1,
          profileId: -1,
        },
      ];
      await DatabaseClient.prisma.$transaction(
        Bot.Exp.trainAll(profile.team.players, bonuses).map((player) =>
          DatabaseClient.prisma.player.update({
            where: { id: player.id },
            data: player.xp,
          }),
        ),
      );
    }

    return Promise.resolve(match);
  });
}
