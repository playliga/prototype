/**
 * Play IPC handlers.
 *
 * @module
 */
import type { Prisma } from '@prisma/client';
import log from 'electron-log';
import AppInfo from 'package.json';
import { dialog, ipcMain, shell } from 'electron';
import { flatten, merge, sample } from 'lodash';
import { Constants, Dedent, Eagers, Util } from '@liga/shared';
import {
  DatabaseClient,
  Game,
  Scorebot,
  Simulator,
  WindowManager,
  Worldgen,
} from '@liga/backend/lib';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(
    Constants.IPCRoute.PLAY_EXHIBITION,
    async (_, settings: typeof Constants.Settings, teamIds: Array<number>, teamId: number) => {
      // configure default map if none selected
      if (!settings.matchRules.mapOverride) {
        const mapPool = await DatabaseClient.prisma.mapPool.findMany({
          where: {
            gameVersion: { slug: settings.general.game },
          },
          include: Eagers.mapPool.include,
        });
        settings.matchRules.mapOverride = sample(mapPool).gameMap.name;
      }

      // minimize the landing window
      const landingWindow = WindowManager.get(Constants.WindowIdentifier.Landing);
      landingWindow.minimize();

      // grab team info
      const [home, away] = await Promise.all(
        teamIds.map((id) =>
          DatabaseClient.prisma.team.findFirst({
            where: { id },
            include: Eagers.team.include,
          }),
        ),
      );

      // grab user's chosen team
      const userTeam = [home, away].find((team) => team.id === teamId);

      // load federation and tier info
      const federation = await DatabaseClient.prisma.federation.findFirst({
        where: {
          slug: Constants.FederationSlug.ESPORTS_WORLD,
        },
      });

      // since this is an exhibition match we must
      // manually build the match-related objects
      const profile = {
        teamId: userTeam.id,
        playerId: userTeam.players[0].id,
        settings: JSON.stringify(settings),
      } as Prisma.ProfileGetPayload<unknown>;

      const tier = {
        name: 'Exhibition',
        slug: Constants.TierSlug.EXHIBITION_FRIENDLY,
        groupSize: 0,
        league: {
          name: 'Exhibition',
        },
      } as Prisma.TierGetPayload<{ include: { league: true } }>;

      const match = {
        games: [
          {
            map: settings.matchRules.mapOverride,
            status: Constants.MatchStatus.READY,
          },
        ],
        competitors: [home, away].map((team) => ({
          teamId: team.id,
          team,
        })),
        competition: {
          federation,
          tier,
          competitors: [home, away].map((team) => ({
            teamId: team.id,
            team: team as Omit<typeof team, 'players' | 'country'>,
          })),
        },
      } as Prisma.MatchGetPayload<typeof Eagers.match>;

      // start the server and play the match
      const gameServer = new Game.Server(profile, match);
      await gameServer.start();

      // restore window
      landingWindow.restore();
    },
  );
  ipcMain.handle(Constants.IPCRoute.PLAY_START, async (_, spectating?: boolean) => {
    // grab today's match
    const profile = await DatabaseClient.prisma.profile.findFirst(Eagers.profile);
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

    // load on-the-fly settings
    let settingsLocalStorage: string;

    try {
      settingsLocalStorage = await mainWindow.webContents.executeJavaScript(
        'localStorage.getItem("settings");',
      );
    } catch (_) {
      log.warn('Could not load on-the-fly settings.');
    }

    if (settingsLocalStorage) {
      const settingsLocal = JSON.parse(settingsLocalStorage);
      const settingsRemote = Util.loadSettings(profile.settings);
      profile.settings = JSON.stringify(merge({}, settingsRemote, settingsLocal));
    }

    const settings = Util.loadSettings(profile.settings);

    // start the server and play the match
    let gameServerError: NodeJS.ErrnoException = null;
    const gameServer = new Game.Server(profile, match, null, spectating);

    try {
      await gameServer.start();
    } catch (error) {
      mainWindow.restore();
      log.error(error);
      gameServerError = error;
    }

    // show an error dialog if we ran into issues
    if (gameServerError) {
      const res = await dialog.showMessageBox(mainWindow, {
        type: 'error',
        buttons: ['OK', 'View Troubleshooting Wiki'],
        cancelId: 0,
        message: 'Counter-Strike Game Session Error',
        detail: Dedent.dedent`
          Common causes include missing game plugins, permissions, or firewall issues.

          For workarounds and other known issues, please visit the troubleshooting wiki.

          Error Details:

          __ERROR__
        `.replace('__ERROR__', JSON.stringify(gameServerError, null, 4)),
      });

      if (res.response === 1) {
        await shell.openExternal(
          `${AppInfo.repository.url.replace('.git', '')}/wiki/troubleshooting`,
        );
      }

      return;
    }

    // game over; collect postgame info
    const [homeScore, awayScore] = gameServer.result.score;
    const [home, away] = match.competitors;
    const gameScore = {
      [home.teamId]: homeScore,
      [away.teamId]: awayScore,
    };
    const globalScore = {
      [home.teamId]:
        match.games.length > 1
          ? home.score +
            Number(Simulator.getMatchResult(home.teamId, gameScore) === Constants.MatchResult.WIN)
          : gameScore[home.teamId],
      [away.teamId]:
        match.games.length > 1
          ? away.score +
            Number(Simulator.getMatchResult(away.teamId, gameScore) === Constants.MatchResult.WIN)
          : gameScore[away.teamId],
    };
    const winsToClinch = Math.floor(match.games.length / 2) + 1;
    const matchCompleted = Object.values(globalScore).some((score) => score >= winsToClinch);

    // add the user back into the list of players
    // to record match events properly
    const players = flatten(gameServer.competitors.map((competitor) => competitor.team.players));
    players.push(profile.player);

    // update the match record and create the match events database entries
    await DatabaseClient.prisma.match.update({
      where: { id: match.id },
      data: {
        status: matchCompleted ? Constants.MatchStatus.COMPLETED : match.status,
        competitors: {
          update: match.competitors.map((competitor) => ({
            where: { id: competitor.id },
            data: {
              score: globalScore[competitor.teamId],
              result: matchCompleted
                ? Simulator.getMatchResult(competitor.teamId, globalScore)
                : competitor.result,
            },
          })),
        },
        games: {
          update: {
            where: { id: gameServer.matchGame.id },
            data: {
              status: Constants.MatchStatus.COMPLETED,
              teams: {
                update: gameServer.matchGame.teams.map((team) => ({
                  where: {
                    id: team.id,
                  },
                  data: {
                    score: gameScore[team.teamId],
                    result: Simulator.getMatchResult(team.teamId, gameScore),
                  },
                })),
              },
            },
          },
        },
        players: {
          connect: players.map((player) => ({ id: player.id })),
        },
        events: {
          create: (() => {
            // in order to record things under the correct half we must sort the
            // entries by their timestamp and keep manual track of the rounds
            let half = 0;
            let rounds = 1;

            return gameServer.scorebotEvents
              .sort((a, b) => a.payload.timestamp.getTime() - b.payload.timestamp.getTime())
              .map((event) => {
                switch (event.type) {
                  case Scorebot.EventIdentifier.PLAYER_ASSISTED: {
                    const eventAssisted = event.payload as Scorebot.EventPayloadPlayerAssisted;
                    const assist = players.find(
                      (player) => player.name === eventAssisted.assist.name,
                    );
                    const victim = players.find(
                      (player) => player.name === eventAssisted.victim.name,
                    );
                    return {
                      half,
                      payload: JSON.stringify(event),
                      timestamp: eventAssisted.timestamp,
                      assist: {
                        connect: {
                          id: assist?.id || profile.playerId,
                        },
                      },
                      game: {
                        connect: {
                          id: gameServer.matchGame.id,
                        },
                      },
                      victim: {
                        connect: {
                          id: victim?.id || profile.playerId,
                        },
                      },
                    };
                  }
                  case Scorebot.EventIdentifier.PLAYER_KILLED: {
                    const eventKilled = event.payload as Scorebot.EventPayloadPlayerKilled;
                    const attacker = players.find(
                      (player) => player.name === eventKilled.attacker.name,
                    );
                    const victim = players.find(
                      (player) => player.name === eventKilled.victim.name,
                    );
                    return {
                      half,
                      headshot: eventKilled.headshot,
                      payload: JSON.stringify(event),
                      timestamp: eventKilled.timestamp,
                      weapon: eventKilled.weapon,
                      attacker: {
                        connect: {
                          id: attacker?.id || profile.playerId,
                        },
                      },
                      game: {
                        connect: {
                          id: gameServer.matchGame.id,
                        },
                      },
                      victim: {
                        connect: {
                          id: victim?.id || profile.playerId,
                        },
                      },
                    };
                  }
                  default: {
                    const eventRoundOver = event.payload as Scorebot.EventPayloadRoundOver;
                    const currentHalf = half;
                    const { maxRounds, maxRoundsOvertime } = settings.matchRules;

                    // invert score on odd-numbered halves
                    let invert = half % 2 === 1;

                    // handle overtime conditions where we only swap
                    // on 1st-half of odd-numbered segments
                    //
                    // [  /  ] [  /  ] [  /  ]
                    //  ^           ^   ^
                    //
                    // when an overtime starts, the sides are not swapped, so
                    // every odd-numbered overtime means teams have swapped
                    if (rounds > maxRounds) {
                      const roundsOvertime = rounds - maxRounds;
                      const overtimeCount = Math.ceil(roundsOvertime / maxRoundsOvertime);

                      if (overtimeCount % 2 === 1) {
                        invert = half % 2 === 0; // swap on 1st-half
                      }

                      // figure out if we've reached half-time in this overtime segment
                      const overtimeRound = ((roundsOvertime - 1) % maxRoundsOvertime) + 1;
                      half =
                        overtimeRound === maxRoundsOvertime / 2 ||
                        overtimeRound === maxRoundsOvertime
                          ? ++half
                          : half;
                    } else {
                      half = rounds === maxRounds / 2 || rounds === maxRounds ? ++half : half;
                    }

                    // update round value
                    rounds += 1;

                    // now we can return the data
                    return {
                      half: currentHalf,
                      payload: JSON.stringify(event),
                      result: eventRoundOver.event,
                      timestamp: eventRoundOver.timestamp,
                      game: {
                        connect: {
                          id: gameServer.matchGame.id,
                        },
                      },
                      winner: {
                        connect: {
                          id: match.competitors[
                            invert ? 1 - eventRoundOver.winner : eventRoundOver.winner
                          ].id,
                        },
                      },
                    };
                  }
                }
              });
          })(),
        },
      },
    });

    // bail early if match isn't completed yet and send a profile
    // update so that the match status gets refreshed
    if (!matchCompleted) {
      mainWindow.restore();
      mainWindow.webContents.send(Constants.IPCRoute.PROFILES_CURRENT, profile);
      return WindowManager.send(Constants.WindowIdentifier.Modal, {
        target: '/postgame',
        payload: match.id,
      });
    }

    // clean up on-the-fly settings
    if (settingsLocalStorage) {
      try {
        await mainWindow.webContents.executeJavaScript('localStorage.removeItem("settings");');
      } catch (_) {
        log.warn('Could not remove on-the-fly settings.');
      }
    }

    // check if user won any awards
    await Worldgen.sendUserAward(match.competition);

    // restore window and open the play modal
    mainWindow.restore();
    WindowManager.send(Constants.WindowIdentifier.Modal, {
      target: '/postgame',
      payload: match.id,
    });
  });
}
