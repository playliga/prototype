/**
 * Play IPC handlers.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { Constants, Eagers } from '@liga/shared';
import { DatabaseClient, Game, Simulator, WindowManager } from '@liga/backend/lib';

/**
 * IPC handler.
 *
 * Handles the play event.
 *
 * @function
 */
async function handlePlayStart() {
  // grab today's match
  const profile = await DatabaseClient.prisma.profile.findFirst();
  const entry = await DatabaseClient.prisma.calendar.findFirst({
    where: {
      date: profile.date,
      type: Constants.CalendarEntry.MATCHDAY_USER,
    },
  });
  const match = await DatabaseClient.prisma.match.findFirst({
    where: {
      id: Number(entry.payload),
    },
    include: Eagers.match.include,
  });

  // minimize main window
  const mainWindow = WindowManager.get(Constants.WindowIdentifier.Main);
  mainWindow.minimize();

  // start the server and play the match
  const gameServer = new Game.Server(profile, match);
  const result = await gameServer.start();

  // game over, save the result to the db
  const [homeScore, awayScore] = result.score;
  const [home, away] = match.competitors;
  const finalScore = {
    [home.id]: homeScore,
    [away.id]: awayScore,
  };

  await DatabaseClient.prisma.match.update({
    where: { id: match.id },
    data: {
      status: Constants.MatchStatus.COMPLETED,
      competitors: {
        update: match.competitors.map((competitor) => ({
          where: { id: competitor.id },
          data: {
            score: finalScore[competitor.id],
            result: Simulator.getMatchResult(competitor.id, finalScore),
          },
        })),
      },
    },
  });

  // restore window and return
  mainWindow.restore();
  return Promise.resolve();
}

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.PLAY_START, handlePlayStart);
}
