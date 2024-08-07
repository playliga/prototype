/**
 * Seeds the database with Federations and their continents.
 *
 * Federations group continents together in order to help solve
 * for the disparity between teams available per continent.
 *
 * @module
 */
import { PrismaClient } from '@prisma/client';
import { continents } from 'countries-list';
import { Constants } from '@liga/shared';

/** @type {ContinentCode} */
type ContinentCode = keyof typeof continents;

/**
 * The seed data.
 *
 * @constant
 */
export const data = [
  {
    name: 'Electronic Sports Americas',
    slug: Constants.FederationSlug.ESPORTS_AMERICAS,
    continents: ['an', 'na', 'sa'],
  },
  {
    name: 'Electronic Sports Europa',
    slug: Constants.FederationSlug.ESPORTS_EUROPA,
    continents: ['af', 'as', 'eu', 'oc'],
  },
  {
    name: 'World',
    slug: Constants.FederationSlug.ESPORTS_WORLD,
    continents: [''],
  },
];

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  // build the transaction
  const transaction = data.map((federation) =>
    prisma.federation.upsert({
      where: { slug: federation.slug },
      update: {
        name: federation.name,
        slug: federation.slug,
        continents: {
          upsert: Object.keys(continents)
            .filter((code) => federation.continents.includes(code.toLowerCase()))
            .map((code: ContinentCode) => ({
              where: {
                code,
              },
              update: {
                code,
                name: continents[code],
              },
              create: {
                code,
                name: continents[code],
              },
            })),
        },
      },
      create: {
        name: federation.name,
        slug: federation.slug,
        continents: {
          create: Object.keys(continents)
            .filter((code) => federation.continents.includes(code.toLowerCase()))
            .map((code: ContinentCode) => ({
              code,
              name: continents[code],
            })),
        },
      },
      include: {
        continents: true,
      },
    }),
  );

  // run the transaction
  return prisma.$transaction(transaction);
}
