/**
 * Seeds the database with the autofill schema
 * used by Worldgen to populate competitions.
 *
 * @module
 */
import { flatten } from 'lodash';
import { Autofill, AutofillEntry, Prisma, PrismaClient } from '@prisma/client';
import { Constants } from '@liga/shared';

/** @interface */
interface SeedData {
  tier: Constants.TierSlug;
  autofill: Partial<Autofill> & { entries: Array<Prisma.AutofillEntryCreateWithoutAutofillInput> };
}

/**
 * The seed data.
 *
 * @constant
 */
const data: Array<SeedData> = [
  {
    tier: Constants.TierSlug.LEAGUE_OPEN,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_OPEN,
          start: Constants.Zones.LEAGUE_MID_TABLE_START,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
          start: Constants.Zones.LEAGUE_RELEGATION_START,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_OPEN,
          start: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.LEAGUE_INTERMEDIATE,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_OPEN,
          start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
          end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
          start: Constants.Zones.LEAGUE_MID_TABLE_START,
          end: Constants.Zones.LEAGUE_MID_TABLE_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_MAIN,
          start: Constants.Zones.LEAGUE_RELEGATION_START,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
          start: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.LEAGUE_MAIN,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
          start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
          end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_MAIN,
          start: Constants.Zones.LEAGUE_MID_TABLE_START,
          end: Constants.Zones.LEAGUE_MID_TABLE_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_ADVANCED,
          start: Constants.Zones.LEAGUE_RELEGATION_START,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_MAIN,
          start: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.LEAGUE_ADVANCED,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_MAIN,
          start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
          end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_ADVANCED,
          start: Constants.Zones.LEAGUE_MID_TABLE_START,
          end: Constants.Zones.LEAGUE_MID_TABLE_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          start: Constants.Zones.LEAGUE_RELEGATION_START,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_ADVANCED,
          start: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.LEAGUE_PREMIER,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_ADVANCED,
          start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
          end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
          end: Constants.Zones.LEAGUE_PROMOTION_AUTO_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          start: Constants.Zones.LEAGUE_MID_TABLE_START,
          end: Constants.Zones.LEAGUE_MID_TABLE_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          start: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.LEAGUE_CUP,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_OPEN,
          start: 0,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
          start: 0,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_MAIN,
          start: 0,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_ADVANCED,
          start: 0,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          start: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.CIRCUIT_OPEN,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_OPEN,
          start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
          end: Constants.Zones.LEAGUE_RELEGATION_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
          start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
          end: Constants.Zones.LEAGUE_RELEGATION_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_MAIN,
          start: Constants.Zones.LEAGUE_PROMOTION_AUTO_START,
          end: Constants.Zones.LEAGUE_RELEGATION_END,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_ADVANCED,
          start: 17,
          end: 20,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_OPEN,
          start: 0,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_INTERMEDIATE,
          start: 0,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_MAIN,
          start: 0,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_ADVANCED,
          start: 17,
          end: 20,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.CIRCUIT_CLOSED,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_ADVANCED,
          start: 0,
          end: 16,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_ADVANCED,
          start: 0,
          end: 16,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.CIRCUIT_CLOSED,
    autofill: {
      on: Constants.CalendarEntry.COMPETITION_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_CIRCUIT,
          target: Constants.TierSlug.CIRCUIT_OPEN,
          start: 0,
          end: 16,
          season: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.CIRCUIT_FINALS,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          start: 13,
          end: 20,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          start: 13,
          end: 20,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.CIRCUIT_FINALS,
    autofill: {
      on: Constants.CalendarEntry.COMPETITION_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_CIRCUIT,
          target: Constants.TierSlug.CIRCUIT_CLOSED,
          start: 0,
          end: 8,
          season: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.CIRCUIT_PLAYOFFS,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [],
    },
  },
  {
    tier: Constants.TierSlug.CIRCUIT_PLAYOFFS,
    autofill: {
      on: Constants.CalendarEntry.COMPETITION_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_CIRCUIT,
          target: Constants.TierSlug.CIRCUIT_FINALS,
          start: 0,
          end: 8,
          season: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.ESWC_CHALLENGERS,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
          start: 9,
          end: 12,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
          start: 9,
          end: 12,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
          start: 9,
          end: 12,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
          start: 9,
          end: 12,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.ESWC_CHALLENGERS,
    autofill: {
      on: Constants.CalendarEntry.COMPETITION_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_CIRCUIT,
          target: Constants.TierSlug.CIRCUIT_PLAYOFFS,
          federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
          start: 0,
          end: 4,
          season: 0,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_CIRCUIT,
          target: Constants.TierSlug.CIRCUIT_PLAYOFFS,
          federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
          start: 0,
          end: 4,
          season: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.ESWC_LEGENDS,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
          start: 5,
          end: 8,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
          start: 5,
          end: 8,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
          start: 5,
          end: 8,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
          start: 5,
          end: 8,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.ESWC_LEGENDS,
    autofill: {
      on: Constants.CalendarEntry.COMPETITION_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_WORLD_CUP,
          target: Constants.TierSlug.ESWC_CHALLENGERS,
          start: 0,
          end: 8,
          season: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.ESWC_CHAMPIONS,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
          start: 0,
          end: 4,
          season: -1,
        },
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
          start: 0,
          end: 4,
          season: -1,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_AMERICAS,
          start: 0,
          end: 4,
        },
        {
          action: Constants.AutofillAction.FALLBACK,
          from: Constants.LeagueSlug.ESPORTS_LEAGUE,
          target: Constants.TierSlug.LEAGUE_PREMIER,
          federationSlug: Constants.FederationSlug.ESPORTS_EUROPA,
          start: 0,
          end: 4,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.ESWC_CHAMPIONS,
    autofill: {
      on: Constants.CalendarEntry.COMPETITION_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_WORLD_CUP,
          target: Constants.TierSlug.ESWC_LEGENDS,
          start: 0,
          end: 8,
          season: 0,
        },
      ],
    },
  },
  {
    tier: Constants.TierSlug.ESWC_PLAYOFFS,
    autofill: {
      on: Constants.CalendarEntry.SEASON_START,
      entries: [],
    },
  },
  {
    tier: Constants.TierSlug.ESWC_PLAYOFFS,
    autofill: {
      on: Constants.CalendarEntry.COMPETITION_START,
      entries: [
        {
          action: Constants.AutofillAction.INCLUDE,
          from: Constants.LeagueSlug.ESPORTS_WORLD_CUP,
          target: Constants.TierSlug.ESWC_CHAMPIONS,
          start: 0,
          end: 8,
          season: 0,
        },
      ],
    },
  },
];

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  // grab all tiers
  const tiers = await prisma.tier.findMany({
    include: {
      league: {
        include: {
          federations: true,
        },
      },
    },
  });

  // grab the corresponding autofill schema
  // per tier and build the transaction
  const transaction = tiers
    .map((tier) => ({
      tier,
      items: data.filter((item) => item.tier === tier.slug),
    }))
    .map(({ tier, items }) =>
      // create an autofill record per federation
      tier.league.federations.map((federation) =>
        items.map((item) =>
          prisma.autofill.upsert({
            where: {
              // since an autofill record does not have a slug, it can
              // be uniquely identified via its composite key
              on_federationId_tierId: {
                on: item.autofill.on,
                federationId: federation.id,
                tierId: tier.id,
              },
            },
            update: {},
            create: {
              on: item.autofill.on,
              entries: {
                create: item.autofill.entries as AutofillEntry[],
              },
              tier: {
                connect: { id: tier.id },
              },
              federation: {
                connect: { id: federation.id },
              },
            },
          }),
        ),
      ),
    );

  // run the transaction
  return prisma.$transaction(flatten(flatten(transaction)));
}
