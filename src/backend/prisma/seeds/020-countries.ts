/**
 * Seeds the database with countries.
 *
 * @module
 */
import { PrismaClient } from '@prisma/client';
import { countries } from 'countries-list';

/** @type {CountryCode} */
type CountryCode = keyof typeof countries;

/**
 * The main seeder.
 *
 * @param prisma The prisma client.
 * @function
 */
export default async function (prisma: PrismaClient) {
  // grab continents
  const continents = await prisma.continent.findMany();

  // build the transaction
  const transaction = Object.keys(countries).map((code: CountryCode) =>
    prisma.country.upsert({
      where: { code },
      update: {
        code,
        name: countries[code].name,
        continent: {
          connect: {
            id: continents.find((continent) => continent.code === countries[code].continent).id,
          },
        },
      },
      create: {
        code,
        name: countries[code].name,
        continent: {
          connect: {
            id: continents.find((continent) => continent.code === countries[code].continent).id,
          },
        },
      },
      include: {
        continent: true,
      },
    }),
  );

  // run the transaction
  return prisma.$transaction(transaction);
}
