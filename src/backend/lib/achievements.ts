/**
 * Achievement manager.
 *
 * @module
 */
import * as Bus from './bus';
import * as WindowManager from './window-manager';
import DatabaseClient from './database-client';
import { Prisma } from '@prisma/client';
import { Bot, Constants, Eagers } from '@liga/shared';

/**
 * Checks for completion of achievements.
 *
 * @class
 */
class Manager {
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
    const achievement = await DatabaseClient.prisma.achievement.update({
      where: {
        id: achievementId,
      },
      data: {
        unlocked: true,
      },
    });

    // award the user's team
    await DatabaseClient.prisma.team.updateMany({
      where: {
        profile: {
          isNot: null,
        },
      },
      data: {
        earnings: {
          increment: achievement.award,
        },
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
   * **King of the World**
   *
   * Win your first major.
   *
   * @param competition The competition database record.
   * @function
   */
  public static async kingOfTheWorld(
    competition: Prisma.CompetitionGetPayload<typeof Eagers.competitionAlt>,
  ) {
    // bail early if already unlocked
    if (await Manager.checkUnlocked(Constants.Achievement.KING_OF_THE_WORLD)) {
      return;
    }

    // bail if not the right type of competition
    if (competition.tier.slug !== Constants.TierSlug.ESWC_PLAYOFFS) {
      return;
    }

    // bail if conditions not met
    const profile = await DatabaseClient.prisma.profile.findFirst();

    try {
      await DatabaseClient.prisma.competition.findFirstOrThrow({
        where: {
          season: profile.season,
          tier: {
            slug: Constants.TierSlug.ESWC_PLAYOFFS,
          },
          competitors: {
            some: {
              position: 1,
              teamId: profile.teamId,
            },
          },
        },
      });
    } catch (_) {
      return;
    }

    // mark achievement as unlocked
    return Manager.markUnlocked(Constants.Achievement.KING_OF_THE_WORLD);
  }

  /**
   * **Flawless**
   *
   * Complete a division with all wins.
   *
   * @param competition The competition database record.
   * @function
   */
  public static async flawless(
    competition: Prisma.CompetitionGetPayload<typeof Eagers.competitionAlt>,
  ) {
    // bail early if already unlocked
    if (await Manager.checkUnlocked(Constants.Achievement.FLAWLESS)) {
      return;
    }

    // bail if not the right type of competition
    if (!Constants.Prestige.includes(competition.tier.slug as Constants.TierSlug)) {
      return;
    }

    // bail if conditions not met
    const profile = await DatabaseClient.prisma.profile.findFirst<typeof Eagers.profile>();

    try {
      await DatabaseClient.prisma.competition.findFirstOrThrow({
        where: {
          season: profile.season,
          tier: {
            slug: Constants.Prestige[profile.team.tier],
          },
          competitors: {
            some: {
              loss: 0,
              draw: 0,
              teamId: profile.teamId,
            },
          },
        },
      });
    } catch (_) {
      return;
    }

    // mark achievement as unlocked
    return Manager.markUnlocked(Constants.Achievement.FLAWLESS);
  }

  /**
   * **Kenshi**
   *
   * Train a player to max stats.
   *
   * @function
   */
  public static async kenshi() {
    // bail early if already unlocked
    if (await Manager.checkUnlocked(Constants.Achievement.KENSHI)) {
      return;
    }

    // get players directly to bypass profile cache
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const players = await DatabaseClient.prisma.player.findMany({
      where: {
        teamId: profile.teamId,
      },
    });

    // bail if conditions not met
    const max = Bot.Exp.getMaximumXP();
    const maxxed = players.some((player) => Bot.Exp.getTotalXP(JSON.parse(player.stats)) >= max);

    if (!maxxed) {
      return;
    }

    // mark achievement as unlocked
    return Manager.markUnlocked(Constants.Achievement.KENSHI);
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
   * **Mark in History**
   *
   * Remain unbeaten for 31 consecutive matches.
   *
   * @function
   */
  public static async markInHistory() {
    // bail early if already unlocked
    if (await Manager.checkUnlocked(Constants.Achievement.MARK_IN_HISTORY)) {
      return;
    }

    // bail if conditions not met
    const NUM_MATCHES = 31;
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const matches = await DatabaseClient.prisma.match.findMany({
      take: NUM_MATCHES,
      where: {
        status: Constants.MatchStatus.COMPLETED,
        competitors: {
          some: {
            teamId: profile.teamId,
          },
        },
      },
      include: {
        competitors: {
          select: {
            result: true,
          },
          where: {
            teamId: profile.teamId,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const allWins = matches.every(
      (match) => match.competitors[0].result === Constants.MatchResult.WIN,
    );

    if (matches.length < NUM_MATCHES || !allWins) {
      return;
    }

    // mark achievement as unlocked
    return Manager.markUnlocked(Constants.Achievement.MARK_IN_HISTORY);
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
   * **Poker**
   *
   * Win the major, division playoffs, and the open cup in one season.
   *
   * @function
   */
  public static async poker() {
    // bail early if already unlocked
    if (await Manager.checkUnlocked(Constants.Achievement.POKER)) {
      return;
    }

    // grab relevant competitions
    const profile = await DatabaseClient.prisma.profile.findFirst<typeof Eagers.profile>();
    const slugs = [
      Constants.TierSlug.ESWC_PLAYOFFS,
      Constants.TierSlug.LEAGUE_CUP,
      Constants.Prestige[profile.team.tier] + ':playoffs',
    ];
    const competitions = await DatabaseClient.prisma.competition.findMany({
      select: {
        tier: {
          select: {
            slug: true,
          },
        },
      },
      where: {
        season: profile.season,
        tier: {
          slug: {
            in: slugs,
          },
        },
        competitors: {
          some: {
            position: 1,
            teamId: profile.teamId,
          },
        },
      },
    });

    // bail if conditions not met
    const competitionSlugs = competitions.map((competition) => competition.tier.slug);

    if (!slugs.every((slug) => competitionSlugs.includes(slug))) {
      return;
    }

    // mark achievement as unlocked
    return Manager.markUnlocked(Constants.Achievement.POKER);
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

  /**
   * **Underdog**
   *
   * Win a major without buying any player.
   *
   * @param competition The competition database record.
   * @function
   */
  public static async underdog(
    competition: Prisma.CompetitionGetPayload<typeof Eagers.competitionAlt>,
  ) {
    // bail early if already unlocked
    if (await Manager.checkUnlocked(Constants.Achievement.UNDERDOG)) {
      return;
    }

    // bail if not the right type of competition
    if (competition.tier.slug !== Constants.TierSlug.ESWC_PLAYOFFS) {
      return;
    }

    // bail if user did not win
    const profile = await DatabaseClient.prisma.profile.findFirst();

    try {
      await DatabaseClient.prisma.competition.findFirstOrThrow({
        where: {
          season: profile.season,
          tier: {
            slug: Constants.TierSlug.ESWC_PLAYOFFS,
          },
          competitors: {
            some: {
              position: 1,
              teamId: profile.teamId,
            },
          },
        },
      });
    } catch (_) {
      return;
    }

    // bail if conditions not met
    const transfers = await DatabaseClient.prisma.transfer.findMany({
      where: {
        teamIdFrom: profile.teamId,
        offers: {
          some: {
            status: {
              in: [
                Constants.TransferStatus.PLAYER_ACCEPTED,
                Constants.TransferStatus.TEAM_ACCEPTED,
              ],
            },
          },
        },
      },
    });

    if (transfers.length > 0) {
      return;
    }

    // mark achievement as unlocked
    return Manager.markUnlocked(Constants.Achievement.UNDERDOG);
  }
}

/**
 * Register achievement event handlers.
 *
 * @function
 */
export function handler() {
  Bus.Signal.Instance.on(Bus.MessageIdentifier.MATCH_COMPLETED, () =>
    Promise.all([Manager.markInHistory(), Manager.mountEverest()]),
  );
  Bus.Signal.Instance.on(Bus.MessageIdentifier.SEASON_START, Manager.poker);
  Bus.Signal.Instance.on(Bus.MessageIdentifier.SQUAD_RELEASE_PLAYER, Manager.letItGo);
  Bus.Signal.Instance.on(Bus.MessageIdentifier.TOURNEY_COMPLETED, (competition) =>
    Promise.all([
      Manager.flawless(competition),
      Manager.kingOfTheWorld(competition),
      Manager.underdog(competition),
    ]),
  );
  Bus.Signal.Instance.on(Bus.MessageIdentifier.TRAINING_COMPLETED, Manager.kenshi);
  Bus.Signal.Instance.on(Bus.MessageIdentifier.TRANSFER_COMPLETED, Manager.smoothOperator);
}
