/**
 * Dynamically populates any given competition's series
 * with teams depending on the criteria provided
 * in the autofill protocol schema.
 *
 * @module
 */
import log from 'electron-log';
import DatabaseClient from './database-client';
import { differenceBy, flatten, xorBy } from 'lodash';
import { Prisma, Team } from '@prisma/client';
import { Constants, Eagers } from '@liga/shared';

/**
 * Autofill syntax action types.
 *
 * @enum
 */
export enum Action {
  EXCLUDE = 'exclude',
  FALLBACK = 'fallback',
  INCLUDE = 'include',
}

/** @interface */
export interface Entry {
  action: Action;
  from: Constants.LeagueSlug;
  target: Constants.TierSlug;
  start: Constants.Zones | number;
  end?: Constants.Zones | number;
  season?: number;
  federationSlug?: Constants.FederationSlug;
}

/** @interface */
export interface Item {
  tierSlug: Constants.TierSlug;
  on: Constants.CalendarEntry;
  entries: Array<Entry>;
}

/** @constant */
export const Items: Array<Item> = [
  {
    tierSlug: Constants.TierSlug.LEAGUE_OPEN,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      // last place from playoffs (1 player)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_OPEN_PLAYOFFS,
        start: -1,
        season: -1,
      },
      // 5th thru 20th (16 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_OPEN,
        start: Constants.Zones.LEAGUE_MID_TABLE_START,
        season: -1,
      },
      // 18th thru 20th (3 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
        start: Constants.Zones.LEAGUE_RELEGATION_START,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_OPEN,
        start: 0,
      },
      // @todo: remove after beta
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_OPEN,
        start: 4,
        end: 4,
        season: -1,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_OPEN_PLAYOFFS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_OPEN_PLAYOFFS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_OPEN,
        start: 0,
        end: 4,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_INTERMEDIATE,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      // 1st thru 3rd open playoffs (3 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_OPEN_PLAYOFFS,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
        season: -1,
      },
      // last place im playoffs (1 player)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE_PLAYOFFS,
        start: -1,
        season: -1,
      },
      // 5th thru 17th im (13 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
        start: Constants.Zones.LEAGUE_MID_TABLE_START,
        end: Constants.Zones.LEAGUE_MID_TABLE_END,
        season: -1,
      },
      // 18th thru 20th main (3 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN,
        start: Constants.Zones.LEAGUE_RELEGATION_START,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
        start: 0,
      },
      // @todo: remove after beta
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_OPEN,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
        start: 4,
        end: 4,
        season: -1,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_INTERMEDIATE_PLAYOFFS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_INTERMEDIATE_PLAYOFFS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
        start: 0,
        end: 4,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_MAIN,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      // 1st thru 3rd im playoffs (3 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE_PLAYOFFS,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
        season: -1,
      },
      // last place main playoffs (1 player)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN_PLAYOFFS,
        start: -1,
        season: -1,
      },
      // 5th thru 17th main (13 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN,
        start: Constants.Zones.LEAGUE_MID_TABLE_START,
        end: Constants.Zones.LEAGUE_MID_TABLE_END,
        season: -1,
      },
      // 18th thru 20th advanced (3 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: Constants.Zones.LEAGUE_RELEGATION_START,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN,
        start: 0,
      },
      // @todo: remove after beta
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN,
        start: 4,
        end: 4,
        season: -1,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_MAIN_PLAYOFFS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_MAIN_PLAYOFFS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN,
        start: 0,
        end: 4,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_ADVANCED,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      // 1st thru 3rd main playoffs (3 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN_PLAYOFFS,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
        season: -1,
      },
      // last place advanced playoffs (1 player)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED_PLAYOFFS,
        start: -1,
        season: -1,
      },
      // 5th thru 17th advanced (13 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: Constants.Zones.LEAGUE_MID_TABLE_START,
        end: Constants.Zones.LEAGUE_MID_TABLE_END,
        season: -1,
      },
      // 18th thru 20th premier (3 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        start: Constants.Zones.LEAGUE_RELEGATION_START,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: 0,
      },
      // @todo: remove after beta
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: 4,
        end: 4,
        season: -1,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_ADVANCED_PLAYOFFS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_ADVANCED_PLAYOFFS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: 0,
        end: 4,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_PREMIER,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      // 1st thru 3rd advanced playoffs (3 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED_PLAYOFFS,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
        season: -1,
      },
      // 1st thru 17th premier (17 players)
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_MID_TABLE_END,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        start: 0,
      },
      // @todo: remove after beta
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
        season: -1,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_PREMIER_PLAYOFFS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_PREMIER_PLAYOFFS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        start: 0,
        end: 4,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.LEAGUE_CUP,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_OPEN,
        start: 0,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
        start: 0,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN,
        start: 0,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: 0,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        start: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.CIRCUIT_OPEN,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_OPEN,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_RELEGATION_END,
        season: -1,
      },
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_RELEGATION_END,
        season: -1,
      },
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN,
        start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
        end: Constants.Zones.LEAGUE_RELEGATION_END,
        season: -1,
      },
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: 17,
        end: 20,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_OPEN,
        start: 0,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
        start: 0,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_MAIN,
        start: 0,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: 17,
        end: 20,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.CIRCUIT_CLOSED,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: 0,
        end: 16,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_ADVANCED,
        start: 0,
        end: 16,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.CIRCUIT_CLOSED,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_CIRCUIT,
        target: Constants.TierSlug.CIRCUIT_OPEN,
        start: 0,
        end: 16,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.CIRCUIT_FINALS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        start: 13,
        end: 20,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        start: 13,
        end: 20,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.CIRCUIT_FINALS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_CIRCUIT,
        target: Constants.TierSlug.CIRCUIT_CLOSED,
        start: 0,
        end: 8,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.CIRCUIT_PLAYOFFS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [],
  },
  {
    tierSlug: Constants.TierSlug.CIRCUIT_PLAYOFFS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_CIRCUIT,
        target: Constants.TierSlug.CIRCUIT_FINALS,
        start: 0,
        end: 8,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.ESWC_CHALLENGERS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
        start: 9,
        end: 12,
        season: -1,
      },
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
        start: 9,
        end: 12,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
        start: 9,
        end: 12,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
        start: 9,
        end: 12,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.ESWC_CHALLENGERS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_CIRCUIT,
        target: Constants.TierSlug.CIRCUIT_PLAYOFFS,
        federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
        start: 0,
        end: Constants.Zones.CIRCUIT_PLAYOFFS_PROMOTION_AUTO_END,
        season: 0,
      },
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_CIRCUIT,
        target: Constants.TierSlug.CIRCUIT_PLAYOFFS,
        federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
        start: 0,
        end: Constants.Zones.CIRCUIT_PLAYOFFS_PROMOTION_AUTO_END,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.ESWC_LEGENDS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
        start: 5,
        end: 8,
        season: -1,
      },
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
        start: 5,
        end: 8,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
        start: 5,
        end: 8,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
        start: 5,
        end: 8,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.ESWC_LEGENDS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_WORLD_CUP,
        target: Constants.TierSlug.ESWC_CHALLENGERS,
        start: 0,
        end: 8,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.ESWC_CHAMPIONS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
        start: 0,
        end: 4,
        season: -1,
      },
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
        start: 0,
        end: 4,
        season: -1,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
        start: 0,
        end: 4,
      },
      {
        action: Action.FALLBACK,
        from: Constants.LeagueSlug.ESPORTS_LEAGUE,
        target: Constants.TierSlug.LEAGUE_PREMIER,
        federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
        start: 0,
        end: 4,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.ESWC_CHAMPIONS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_WORLD_CUP,
        target: Constants.TierSlug.ESWC_LEGENDS,
        start: 0,
        end: 8,
        season: 0,
      },
    ],
  },
  {
    tierSlug: Constants.TierSlug.ESWC_PLAYOFFS,
    on: Constants.CalendarEntry.SEASON_START,
    entries: [],
  },
  {
    tierSlug: Constants.TierSlug.ESWC_PLAYOFFS,
    on: Constants.CalendarEntry.COMPETITION_START,
    entries: [
      {
        action: Action.INCLUDE,
        from: Constants.LeagueSlug.ESPORTS_WORLD_CUP,
        target: Constants.TierSlug.ESWC_CHAMPIONS,
        start: 0,
        end: 8,
        season: 0,
      },
    ],
  },
];

/**
 * Include only teams that meet the specific criteria.
 *
 * @param entry       The autofill entry.
 * @param federation  Federation database record.
 * @function
 */
async function handleIncludeAction(
  entry: Entry,
  federation: Prisma.FederationGetPayload<unknown>,
): Promise<Array<Team>> {
  const profile = await DatabaseClient.prisma.profile.findFirst();
  const competition = await DatabaseClient.prisma.competition.findFirst({
    where: {
      season: profile.season + entry.season,
      tier: {
        slug: entry.target,
        league: {
          slug: entry.from,
        },
      },
      federation: {
        slug: entry.federationSlug || federation.slug,
      },
    },
    include: {
      competitors: {
        orderBy: { position: 'asc' },
        include: {
          team: true,
        },
      },
    },
  });

  if (!competition) {
    return Promise.resolve([]);
  }

  const competitors = competition.competitors.slice(
    entry.start < 0 ? entry.start : Math.max(0, entry.start - 1),
    entry.end || undefined,
  );

  return Promise.resolve(competitors.map((competitor) => competitor.team));
}

/**
 * Do not consider teams that meet the criteria.
 *
 * @param entry The autofill entry.
 * @function
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleExcludeAction(entry: Entry) {
  // e.g.: ignore top 3 of last season's major
  return Promise.resolve([]);
}

/**
 * An include action that is used to backfill the teams list.
 *
 * @param entry       The autofill entry.
 * @param tier        Tier database record.
 * @param federation  Federation database record.
 * @function
 */
async function handleFallbackAction(
  entry: Entry,
  tier: Prisma.TierGetPayload<typeof Eagers.tier>,
  federation: Prisma.FederationGetPayload<unknown>,
) {
  const teams = await DatabaseClient.prisma.team.findMany({
    where: {
      prestige: Constants.Prestige.findIndex((prestige) => prestige === entry.target),
      country: {
        continent: {
          federation: {
            slug: entry.federationSlug || federation.slug,
          },
        },
      },
    },
  });

  if (!teams.length) {
    log.warn(
      'Could not backfill %s - %s. Found %d teams.',
      federation.name,
      tier.name,
      teams.length,
    );
  }

  return teams.slice(Math.max(0, entry.start - 1), entry.end || undefined);
}

/**
 * Parses the autofill syntax logic.
 *
 * @param item        The autofill item.
 * @param tier        Tier database record.
 * @param federation  Federation database record.
 * @function
 */
export async function parse(
  item: Item,
  tier: Prisma.TierGetPayload<typeof Eagers.tier>,
  federation: Prisma.FederationGetPayload<unknown>,
) {
  // fill competitors list using this autofill item's entries
  const competitors = [] as Array<Team>;

  // collect competitors
  const includeList = await Promise.all(
    flatten(
      item.entries
        .filter((entry) => entry.action === Action.INCLUDE)
        .map((entry) => handleIncludeAction(entry, federation)),
    ),
  );

  // exclude undesirables
  const excludeList = await Promise.all(
    flatten(
      item.entries.filter((entry) => entry.action === Action.EXCLUDE).map(handleExcludeAction),
    ),
  );

  // create unique list of competitors by
  // filtering out the excludes
  competitors.push(...xorBy(flatten(includeList), flatten(excludeList), 'id'));

  // if the required quota for the current tier is not met then
  // use the fallback entries to backfill the competitors list
  const quota = item.entries
    .filter((entry) => entry.action === Action.INCLUDE)
    .map((entry) =>
      entry.start < 0
        ? Math.abs(entry.start)
        : (entry.end || tier.size) - Math.max(0, entry.start - 1),
    )
    .reduce((a, b) => a + b, 0);

  if (!quota || competitors.length < quota) {
    let fallbackList: Awaited<ReturnType<typeof handleIncludeAction>>;

    // use the standard include action logic if the
    // fallback entry contains a season property
    fallbackList = flatten(
      await Promise.all(
        item.entries
          .filter((entry) => entry.action === Action.FALLBACK && 'season' in entry)
          .map((entry) => handleIncludeAction(entry, federation)),
      ),
    );

    // if that still doesn't meet the quota, then use the default fallback
    if (!fallbackList.length || fallbackList.length < quota - competitors.length) {
      fallbackList = flatten(
        await Promise.all(
          item.entries
            .filter((entry) => entry.action === Action.FALLBACK && !entry.season)
            .map((entry) => handleFallbackAction(entry, tier, federation)),
        ),
      );
    }

    competitors.push(...differenceBy(fallbackList, competitors, 'id'));
  }

  log.info(
    'Autofilled %s - %s with %d teams',
    federation.name,
    tier.name,
    competitors.slice(0, tier.size).length,
  );

  // return our payload
  return Promise.resolve(competitors.slice(0, tier.size));
}
