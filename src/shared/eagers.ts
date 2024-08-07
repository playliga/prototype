/**
 * Various constants to eager load database entries.
 *
 * @module
 */

/** @constant */
export const autofill = {
  include: {
    entries: true,
    federation: true,
    tier: {
      include: {
        league: true,
      },
    },
  },
};

/** @constant */
export const competition = {
  include: {
    competitors: {
      include: {
        team: true,
      },
    },
    federation: true,
    tier: {
      include: {
        league: true,
      },
    },
  },
};

/** @constant */
export const continent = {
  include: { countries: true },
};

/** @constant */
export const email = {
  include: {
    from: true,
    dialogues: true,
  },
};

/** @constant */
export const match = {
  include: {
    competition: {
      include: competition.include,
    },
    competitors: {
      include: {
        team: {
          include: {
            country: true,
            players: true,
          },
        },
      },
    },
    games: true,
  },
};

/** @constant */
export const player = {
  include: { country: true, team: true },
};

/** @constant */
export const profile = {
  include: {
    team: {
      include: {
        personas: true,
        players: player,
      },
    },
    player: true,
  },
};

/** @constant */
export const team = {
  include: { country: true },
};

/** @constant */
export const transfer = {
  include: {
    from: team,
    offers: true,
    target: player,
    to: {
      include: {
        players: true,
        personas: true,
      },
    },
  },
};
