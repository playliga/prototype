/**
 * Achievement manager.
 *
 * ## TODOs
 *
 * - **King of the World** Win your first Major.
 *    - `TOURNEY_COMPLETED`
 * - **Mark In History** Remain Unbeaten for 31 consecutive matches.
 *    - `MATCH_COMPLETED`
 * - **Kenshi** Train a Player to Max Stats.
 *    - `TRAINING_COMPLETED`
 * - **Underdog** Win a Major without buying any player.
 *    - `TOURNEY_COMPLETED`
 *    - `MATCH_UPDATE_MAP_LIST`
 * - **Poker** Win Major, Division, Open Cup and Sponsor Tournament in one Season.
 *    - `SEASON_COMPLETED`
 *
 * @module
 */
import * as Bus from './bus';
import * as WindowManager from './window-manager';
import log from 'electron-log';
import Tournament from '@liga/shared/tournament';
import DatabaseClient from './database-client';
import { Prisma } from '@prisma/client';
import { Constants, Eagers } from '@liga/shared';

/**
 * Checks for completion of achievements.
 *
 * @class
 */
class Manager {
  /**
   * Scoped electron-log instance.
   *
   * @constant
   */
  private static log = log.scope('achievements');

  /**
   * Checks if an achievement is already unlocked.
   *
   * @param achievementId The achievement identifier.
   * @function
   */
  private static checkUnlocked(achievementId: Constants.Achievement) {
    return DatabaseClient.prisma.achievement.findFirst({
      where: {
        id: achievementId,
        unlocked: true,
      },
    });
  }

  /**
   * Marks an achievement as unlocked.
   *
   * @param achievementId The achievement identifier.
   * @function
   */
  private static async markUnlocked(achievementId: Constants.Achievement) {
    // mark achievement as unlocked
    await DatabaseClient.prisma.achievement.update({
      where: {
        id: achievementId,
      },
      data: {
        unlocked: true,
      },
    });

    // send signals
    WindowManager.get(Constants.WindowIdentifier.Main).webContents?.send(
      Constants.IPCRoute.ACHIEVEMENT_UNLOCKED,
      achievementId,
    );
    WindowManager.get(Constants.WindowIdentifier.Main).webContents?.send(
      Constants.IPCRoute.CONFETTI_START,
    );
  }

  /**
   * **Flawless**
   *
   * Complete a division with all wins.
   *
   * @param competition The competition database record.
   * @param tournament  Tournament instance.
   * @function
   */
  public static async flawless(
    competition: Prisma.CompetitionGetPayload<typeof Eagers.competitionAlt>,
    tournament: Tournament,
  ) {
    // bail early if already unlocked
    if (await Manager.checkUnlocked(Constants.Achievement.FLAWLESS)) {
      return;
    }

    // bail if not the right type of competition
    if (!Constants.Prestige.includes(competition.tier.slug as Constants.TierSlug)) {
      return;
    }

    // bail if cannot find user's seed
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const userCompetitorId = competition.competitors.find(
      (competitor) => competitor.teamId === profile.teamId,
    );
    const userSeed = tournament.getSeedByCompetitorId(userCompetitorId?.id);

    if (!userSeed) {
      return;
    }

    // bail if conditions not met
    const results = tournament.$base.resultsFor(userSeed);

    if (results.draws > 0 || results.losses > 0) {
      return;
    }

    // mark achievement as unlocked
    return Manager.markUnlocked(Constants.Achievement.FLAWLESS);
  }

  /**
   * **Let it Go**
   *
   * Release a player from your team.
   *
   * @function
   */
  public static async letItGo() {
    // bail early if already unlocked
    if (await Manager.checkUnlocked(Constants.Achievement.LET_IT_GO)) {
      return;
    }

    // mark achievement as unlocked
    return Manager.markUnlocked(Constants.Achievement.LET_IT_GO);
  }

  /**
   * **Mount Everest**
   *
   * Reach the top of the World Ranking.
   *
   * @function
   */
  public static async mountEverest() {
    // bail early if already unlocked
    if (await Manager.checkUnlocked(Constants.Achievement.MOUNT_EVEREST)) {
      return;
    }

    // bail if conditions not met
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const ranking = await DatabaseClient.prisma.team.getWorldRanking(profile.teamId);

    if (ranking !== 1) {
      return;
    }

    // mark achievement as unlocked
    return Manager.markUnlocked(Constants.Achievement.MOUNT_EVEREST);
  }

  /**
   * **Smooth Operator**
   *
   * Buy a player for less than his market value.
   *
   * @param transfer The transfer details.
   * @function
   */
  public static async smoothOperator(transfer: Prisma.TransferGetPayload<typeof Eagers.transfer>) {
    // bail early if already unlocked
    if (await Manager.checkUnlocked(Constants.Achievement.SMOOTH_OPERATOR)) {
      return;
    }

    // bail if conditions not met
    const profile = await DatabaseClient.prisma.profile.findFirst();

    if (transfer.from.id !== profile.teamId || transfer.offers[0].cost >= transfer.target.cost) {
      return;
    }

    // mark achievement as unlocked
    return Manager.markUnlocked(Constants.Achievement.SMOOTH_OPERATOR);
  }
}

/**
 * Register achievement event handlers.
 *
 * @function
 */
export function handler() {
  Bus.Signal.Instance.on(Bus.MessageIdentifier.SQUAD_RELEASE_PLAYER, Manager.letItGo);
  Bus.Signal.Instance.on(Bus.MessageIdentifier.MATCH_COMPLETED, Manager.mountEverest);
  Bus.Signal.Instance.on(Bus.MessageIdentifier.TOURNEY_COMPLETED, Manager.flawless);
  Bus.Signal.Instance.on(Bus.MessageIdentifier.TRANSFER_COMPLETED, Manager.smoothOperator);
}
