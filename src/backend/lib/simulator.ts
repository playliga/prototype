/**
 * Simulates match scores.
 *
 * @see {score}
 * @module
 */
import type { Prisma } from '@prisma/client';
import log from 'electron-log';
import { random } from 'lodash';
import { Constants, Bot, Chance } from '@liga/shared';

/** @type {Team} */
type Team = Prisma.TeamGetPayload<{ include: { players: true } }>;

/** @enum */
enum SimulationResult {
  DRAW = 15,
  LOSE_HIGH = 14,
  LOSE_LOW = 0,
  WIN = 16,
}

/**
 * Gets the match result for the specified competitor id.
 *
 * @param id The id of the team.
 * @param scores The match scores.
 * @function
 */
export function getMatchResult(
  id: number,
  scores: ReturnType<InstanceType<typeof Score>['generate']>,
) {
  const competitorScore = scores[id];
  const opponentScore = scores[Number(Object.keys(scores).find((key) => Number(key) !== id))];
  return competitorScore > opponentScore
    ? Constants.MatchResult.WIN
    : competitorScore === opponentScore
      ? Constants.MatchResult.DRAW
      : Constants.MatchResult.LOSS;
}

/**
 * Score simulator.
 *
 * @class
 */
export class Score {
  private log: log.LogFunctions;
  public allowDraw: boolean;
  public mode: Constants.SimulationMode;
  public userPlayerId: number;
  public userTeamId: number;

  /**
   * @param allowDraw Allow draws.
   * @param mode      The simulation mode.
   * @constructor
   */
  constructor(allowDraw = false, mode = Constants.SimulationMode.DEFAULT) {
    this.log = log.scope('simulator');
    this.allowDraw = allowDraw;
    this.mode = mode;
  }

  /**
   * Gets the expected score value using the Elo formula.
   *
   * @param ratingA Expected score for Team A.
   * @param ratingB Expected score for Team B.
   * @param scaling Scaling factor for rating differences.
   * @function
   */
  private getEloWinProbability(ratingA: number, ratingB: number, scaling = 400): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / scaling));
  }

  /**
   * Generates a win probability weight based off of the
   * conditions described in the `simulate` function.
   *
   * @param team  The team.
   * @function
   */
  private getTeamWinProbability(team: Team) {
    // don't include the user in the squad when simming
    const players = team.players
      .filter((player) => player.id !== this.userPlayerId)
      .slice(0, Constants.Application.SQUAD_MIN_LENGTH);

    // add the user if squad length is not met
    if (players.length < Constants.Application.SQUAD_MIN_LENGTH && this.userPlayerId) {
      players.push(team.players.find((player) => player.id === this.userPlayerId));
    }

    if (this.userPlayerId) {
      this.log.info(
        'Squad for %s (prestige: %d, tier: %d, length: %d)',
        team.name,
        team.prestige,
        team.tier,
        players.length,
      );
    }

    // generate the win probability per player
    const totalXp = players
      .map((player) => Bot.Exp.getTotalXP(JSON.parse(player.stats)))
      .reduce((a, b) => a + b);
    return totalXp + team.prestige + team.tier;
  }

  /**
   * Simulates match scores calculated using probability weights
   * determined by a team's prestige/tier and the cumulative
   * skill level of their squad.
   *
   * @param teams The home and away teams.
   * @function
   */
  public generate(teams: Array<Team>) {
    const [home, away] = teams;

    if (this.userTeamId) {
      this.log.info('Simulating match (%s vs %s)...', home.name, away.name);
    }

    // simulate final scores
    const score = {
      winner: SimulationResult.WIN,
      loser: random(SimulationResult.LOSE_LOW, SimulationResult.LOSE_HIGH),
    };

    // handle sim mode early since that won't
    // require any probability calculations
    switch (this.mode) {
      case this.userTeamId && Constants.SimulationMode.LOSE:
        return {
          [home.id]: home.id === this.userTeamId ? score.loser : score.winner,
          [away.id]: away.id === this.userTeamId ? score.loser : score.winner,
        };
      case this.userTeamId && Constants.SimulationMode.WIN:
        return {
          [home.id]: home.id === this.userTeamId ? score.winner : score.loser,
          [away.id]: away.id === this.userTeamId ? score.winner : score.loser,
        };
    }

    // calculate probability weight for team
    const homeRating = this.getTeamWinProbability(home);
    const awayRating = this.getTeamWinProbability(away);
    const homeWinPbx = this.getEloWinProbability(homeRating, awayRating);
    const winnerPbxWeight: Record<string | number, number> = {
      [home.id]: homeWinPbx,
      [away.id]: 1 - homeWinPbx,
      [Constants.SimulationMode.DRAW]: 0,
    };

    // do we allow draws? if so, the chance to draw is
    // equal to the team with the lowest prestige
    if (this.allowDraw) {
      const lowestPrestige = Bot.Templates.find(
        (template) =>
          template.prestige === (home.prestige > away.prestige ? away.prestige : home.prestige),
      );
      winnerPbxWeight[Constants.SimulationMode.DRAW] =
        lowestPrestige.multiplier * Constants.Application.SQUAD_MIN_LENGTH;
    }

    // simulate a score
    const winner = Chance.roll(winnerPbxWeight);

    // was it a draw?
    if (this.allowDraw && winner === Constants.SimulationMode.DRAW) {
      return {
        [home.id]: SimulationResult.DRAW,
        [away.id]: SimulationResult.DRAW,
      };
    }

    if (this.userTeamId) {
      const adjustedDistribution = Chance.rangeToDistribution(winnerPbxWeight);
      this.log.info(
        '%s win probability: %d% (raw: %d, total xp: %d)',
        home.name,
        adjustedDistribution[home.id],
        winnerPbxWeight[home.id],
        homeRating,
      );
      this.log.info(
        '%s win probability: %d% (raw: %d, total xp: %d)',
        away.name,
        adjustedDistribution[away.id],
        winnerPbxWeight[away.id],
        awayRating,
      );
      this.log.info('Winner: %s', Number(winner) === home.id ? home.name : away.name);
    }

    // return the winner
    return {
      [home.id]: Number(winner) === home.id ? score.winner : score.loser,
      [away.id]: Number(winner) === away.id ? score.winner : score.loser,
    };
  }
}
