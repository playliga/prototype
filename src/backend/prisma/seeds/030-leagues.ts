/**
 * Seeds the database with leagues and tiers.
 *
 * @module
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { startCase } from 'lodash';
import { Constants } from '@liga/shared';

/** @type {LeagueSeedData} */
type LeagueSeedData = Prisma.LeagueCreateInput & {
  tiers: Array<Prisma.TierCreateWithoutLeagueInput>;
  federations: Array<Constants.FederationSlug>;
};

/**
 * The seed data.
 *
 * @constant
 */
const data: Array<LeagueSeedData> = [
  {
    name: 'Electronic Sports League',
    slug: Constants.LeagueSlug.ESPORTS_LEAGUE,
    startOffsetDays: 60,
    federations: [
      Constants.FederationSlug.ESPORTS_AMERICAS,
      Constants.FederationSlug.ESPORTS_EUROPA,
    ],
    tiers: [
      {
        name: startCase(Constants.TierSlug.LEAGUE_OPEN),
        slug: Constants.TierSlug.LEAGUE_OPEN,
        size: 20,
        groupSize: 20,
        triggerTierSlug: Constants.TierSlug.LEAGUE_OPEN_PLAYOFFS,
      },
      {
        name: startCase(Constants.TierSlug.LEAGUE_OPEN_PLAYOFFS),
        slug: Constants.TierSlug.LEAGUE_OPEN_PLAYOFFS,
        size: 4,
        triggerOffsetDays: 7,
      },
      {
        name: startCase(Constants.TierSlug.LEAGUE_INTERMEDIATE),
        slug: Constants.TierSlug.LEAGUE_INTERMEDIATE,
        size: 20,
        groupSize: 20,
        triggerTierSlug: Constants.TierSlug.LEAGUE_INTERMEDIATE_PLAYOFFS,
      },
      {
        name: startCase(Constants.TierSlug.LEAGUE_INTERMEDIATE_PLAYOFFS),
        slug: Constants.TierSlug.LEAGUE_INTERMEDIATE_PLAYOFFS,
        size: 4,
        triggerOffsetDays: 7,
      },
      {
        name: startCase(Constants.TierSlug.LEAGUE_MAIN),
        slug: Constants.TierSlug.LEAGUE_MAIN,
        size: 20,
        groupSize: 20,
        triggerTierSlug: Constants.TierSlug.LEAGUE_MAIN_PLAYOFFS,
      },
      {
        name: startCase(Constants.TierSlug.LEAGUE_MAIN_PLAYOFFS),
        slug: Constants.TierSlug.LEAGUE_MAIN_PLAYOFFS,
        size: 4,
        triggerOffsetDays: 7,
      },
      {
        name: startCase(Constants.TierSlug.LEAGUE_ADVANCED),
        slug: Constants.TierSlug.LEAGUE_ADVANCED,
        size: 20,
        groupSize: 20,
        triggerTierSlug: Constants.TierSlug.LEAGUE_ADVANCED_PLAYOFFS,
      },
      {
        name: startCase(Constants.TierSlug.LEAGUE_ADVANCED_PLAYOFFS),
        slug: Constants.TierSlug.LEAGUE_ADVANCED_PLAYOFFS,
        size: 4,
        triggerOffsetDays: 7,
      },
      {
        name: startCase(Constants.TierSlug.LEAGUE_PREMIER),
        slug: Constants.TierSlug.LEAGUE_PREMIER,
        size: 20,
        groupSize: 20,
        triggerTierSlug: Constants.TierSlug.LEAGUE_PREMIER_PLAYOFFS,
      },
      {
        name: startCase(Constants.TierSlug.LEAGUE_PREMIER_PLAYOFFS),
        slug: Constants.TierSlug.LEAGUE_PREMIER_PLAYOFFS,
        size: 4,
        triggerOffsetDays: 7,
      },
    ],
  },
  {
    name: 'Electronic Sports League',
    slug: Constants.LeagueSlug.ESPORTS_LEAGUE_CUP,
    startOffsetDays: 90,
    federations: [
      Constants.FederationSlug.ESPORTS_AMERICAS,
      Constants.FederationSlug.ESPORTS_EUROPA,
    ],
    tiers: [
      {
        name: startCase(Constants.TierSlug.LEAGUE_CUP),
        slug: Constants.TierSlug.LEAGUE_CUP,
        size: 100,
      },
    ],
  },
  {
    name: 'Electronic Sports Circuit',
    slug: Constants.LeagueSlug.ESPORTS_CIRCUIT,
    startOffsetDays: 14,
    federations: [
      Constants.FederationSlug.ESPORTS_AMERICAS,
      Constants.FederationSlug.ESPORTS_EUROPA,
    ],
    tiers: [
      {
        name: startCase(Constants.TierSlug.CIRCUIT_OPEN),
        slug: Constants.TierSlug.CIRCUIT_OPEN,
        size: 64,
        groupSize: 8,
        triggerTierSlug: Constants.TierSlug.CIRCUIT_CLOSED,
      },
      {
        name: startCase(Constants.TierSlug.CIRCUIT_CLOSED),
        slug: Constants.TierSlug.CIRCUIT_CLOSED,
        size: 32,
        groupSize: 4,
        triggerOffsetDays: 1,
        triggerTierSlug: Constants.TierSlug.CIRCUIT_FINALS,
      },
      {
        name: startCase(Constants.TierSlug.CIRCUIT_FINALS),
        slug: Constants.TierSlug.CIRCUIT_FINALS,
        size: 16,
        groupSize: 4,
        triggerOffsetDays: 1,
        triggerTierSlug: Constants.TierSlug.CIRCUIT_PLAYOFFS,
      },
      {
        name: startCase(Constants.TierSlug.CIRCUIT_PLAYOFFS),
        slug: Constants.TierSlug.CIRCUIT_PLAYOFFS,
        size: 8,
        triggerOffsetDays: 1,
        triggerTierSlug: Constants.TierSlug.ESWC_CHALLENGERS,
      },
    ],
  },
  {
    name: 'Electronic Sports World Cup',
    slug: Constants.LeagueSlug.ESPORTS_WORLD_CUP,
    federations: [Constants.FederationSlug.ESPORTS_WORLD],
    tiers: [
      {
        name: startCase(Constants.TierSlug.ESWC_CHALLENGERS),
        slug: Constants.TierSlug.ESWC_CHALLENGERS,
        size: 16,
        groupSize: 4,
        triggerOffsetDays: 7,
        triggerTierSlug: Constants.TierSlug.ESWC_LEGENDS,
      },
      {
        name: startCase(Constants.TierSlug.ESWC_LEGENDS),
        slug: Constants.TierSlug.ESWC_LEGENDS,
        size: 16,
        groupSize: 4,
        triggerOffsetDays: 3,
        triggerTierSlug: Constants.TierSlug.ESWC_CHAMPIONS,
      },
      {
        name: startCase(Constants.TierSlug.ESWC_CHAMPIONS),
        slug: Constants.TierSlug.ESWC_CHAMPIONS,
        size: 16,
        groupSize: 4,
        triggerOffsetDays: 3,
        triggerTierSlug: Constants.TierSlug.ESWC_PLAYOFFS,
      },
      {
        name: startCase(Constants.TierSlug.ESWC_PLAYOFFS),
        slug: Constants.TierSlug.ESWC_PLAYOFFS,
        size: 8,
        triggerOffsetDays: 3,
      },
    ],
  },
];

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  // grab all federations
  const federations = await prisma.federation.findMany();

  // build the transaction
  const transaction = data.map((league) =>
    prisma.league.upsert({
      where: { slug: league.slug },
      update: {
        name: league.name,
        slug: league.slug,
        startOffsetDays: league.startOffsetDays,
        federations: {
          connect: federations
            .filter((federation) =>
              league.federations.includes(federation.slug as Constants.FederationSlug),
            )
            .map((federation) => ({ id: federation.id })),
        },
        tiers: {
          upsert: league.tiers.map((tier) => ({
            where: {
              slug: tier.slug,
            },
            update: tier,
            create: tier,
          })),
        },
      },
      create: {
        name: league.name,
        slug: league.slug,
        startOffsetDays: league.startOffsetDays,
        federations: {
          connect: federations
            .filter((federation) =>
              league.federations.includes(federation.slug as Constants.FederationSlug),
            )
            .map((federation) => ({ id: federation.id })),
        },
        tiers: {
          create: league.tiers,
        },
      },
    }),
  );

  // run the transaction
  return prisma.$transaction(transaction);
}
