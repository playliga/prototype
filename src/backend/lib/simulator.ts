/**
 * Simulates match scores.
 *
 * @see {score}
 * @module
 */
import type { Prisma } from '@prisma/client';
import { random } from 'lodash';
import { Constants, Bot, Chance } from '@liga/shared';

/** @type {Team} */
type Team = Prisma.TeamGetPayload<{ include: { players: true } }>;

/**
 * Possible simulation results and scores.
 *
 * @enum
 */
enum SimulationResult {
  DRAW = 15,
  LOSE_HIGH = 14,
  LOSE_LOW = 0,
  WIN = 16,
}

/**
 * Simulation settings.
 *
 * @constant
 */
const defaultSimulationSettings = {
  allowDraw: true,
  mode: Constants.SimulationMode.DEFAULT,
  userTeamId: null as number,
};

/**
 * Gets the match result for the specified competitor id.
 *
 * @param id The id of the team.
 * @param scores The match scores.
 * @function
 */
export function getMatchResult(id: number, scores: ReturnType<typeof score>) {
  const competitorScore = scores[id];
  const opponentScore = scores[Number(Object.keys(scores).find((key) => Number(key) !== id))];
  return competitorScore > opponentScore
    ? Constants.MatchResult.WIN
    : competitorScore === opponentScore
      ? Constants.MatchResult.DRAW
      : Constants.MatchResult.LOSS;
}

/**
 * Generates a win probability weight based off of the
 * conditions described in the `simulate` function.
 *
 * @param team  The team.
 * @function
 */
function getTeamWinProbability(team: Team) {
  return team.players
    .slice(0, Constants.Application.SQUAD_MIN_LENGTH)
    .map((player) => new Bot.Exp(JSON.parse(player.stats)).getBotTemplate().multiplier)
    .reduce((a, b) => a + b + team.prestige + team.tier);
}

/**
 * Simulates match scores calculated using probability weights
 * determined by a team's prestige/tier and the cumulative
 * skill level of their squad.
 *
 * @param teams               The home and away teams.
 * @param settings            Simulation settings.
 * @function
 */
export function score(
  teams: Team[],
  settings = defaultSimulationSettings as Partial<typeof defaultSimulationSettings>,
) {
  // load args
  const simulationSettings = { ...defaultSimulationSettings, ...settings };
  const [home, away] = teams;

  // simulate final scores
  const score = {
    winner: SimulationResult.WIN,
    loser: random(SimulationResult.LOSE_LOW, SimulationResult.LOSE_HIGH),
  };

  // handle sim mode early since that won't
  // require any probability calculations
  switch (simulationSettings.mode) {
    case simulationSettings.userTeamId && Constants.SimulationMode.LOSE:
      return {
        [home.id]: home.id === simulationSettings.userTeamId ? score.loser : score.winner,
        [away.id]: away.id === simulationSettings.userTeamId ? score.loser : score.winner,
      };
    case simulationSettings.userTeamId && Constants.SimulationMode.WIN:
      return {
        [home.id]: home.id === simulationSettings.userTeamId ? score.winner : score.loser,
        [away.id]: away.id === simulationSettings.userTeamId ? score.winner : score.loser,
      };
  }

  // calculate probability weight for team
  const winnerPbxWeight: Record<string | number, number> = {
    [home.id]: getTeamWinProbability(home),
    [away.id]: getTeamWinProbability(away),
    [Constants.SimulationMode.DRAW]: 0,
  };

  // do we allow draws? if so, the chance to draw is
  // equal to the team with the lowest prestige
  if (simulationSettings.allowDraw) {
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
  if (simulationSettings.allowDraw && winner === Constants.SimulationMode.DRAW) {
    return {
      [home.id]: SimulationResult.DRAW,
      [away.id]: SimulationResult.DRAW,
    };
  }

  // return the winner
  return {
    [home.id]: Number(winner as string) === home.id ? score.winner : score.loser,
    [away.id]: Number(winner as string) === away.id ? score.winner : score.loser,
  };
}
