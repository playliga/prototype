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
      this.log.debug(
        'Squad for %s (prestige: %d, tier: %d): %s',
        team.name,
        team.prestige,
        team.tier,
        JSON.stringify(players.map((player) => player.name)),
      );
    }

    // generate the win probability per player
    return players
      .map((player) => new Bot.Exp(JSON.parse(player.stats)).getBotTemplate().multiplier)
      .reduce((a, b) => a + b + team.prestige + team.tier);
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
      this.log.debug('Simulating match (%s vs %s)...', home.name, away.name);
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
    const winnerPbxWeight: Record<string | number, number> = {
      [home.id]: this.getTeamWinProbability(home),
      [away.id]: this.getTeamWinProbability(away),
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
      this.log.debug('%s win probability: %d%', home.name, adjustedDistribution[home.id]);
      this.log.debug('%s win probability: %d%', away.name, adjustedDistribution[away.id]);
      this.log.debug('Winner: %s', Number(winner) === home.id ? home.name : away.name);
    }

    // return the winner
    return {
      [home.id]: Number(winner) === home.id ? score.winner : score.loser,
      [away.id]: Number(winner) === away.id ? score.winner : score.loser,
    };
  }
}
