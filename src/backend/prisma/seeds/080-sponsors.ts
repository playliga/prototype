/**
 * Sponsors seeder.
 *
 * @module
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { Constants } from '@liga/shared';

/** @constant */
export const data: Array<Prisma.SponsorCreateInput> = [
  {
    name: 'Aloha Energy',
    slug: Constants.SponsorSlug.ALOHA_ENERGY,
    description: 'Energy drink company.',
    logo: `resources://sponsors/${Constants.SponsorSlug.ALOHA_ENERGY}.svg`,
  },
  {
    name: 'BlueQuil',
    slug: Constants.SponsorSlug.BLUEQUIL,
    description: 'Energy drink company.',
    logo: `resources://sponsors/${Constants.SponsorSlug.BLUEQUIL}.svg`,
  },
  {
    name: 'GogTech',
    slug: Constants.SponsorSlug.GOGTECH,
    description: 'Premier gaming gear supplier.',
    logo: `resources://sponsors/${Constants.SponsorSlug.GOGTECH}.svg`,
  },
  {
    name: 'HeavenCase',
    slug: Constants.SponsorSlug.HEAVENCASE,
    description: 'Esports case website.',
    logo: `resources://sponsors/${Constants.SponsorSlug.HEAVENCASE}.svg`,
  },
  {
    name: '9kBet',
    slug: Constants.SponsorSlug.NINEKBET,
    description: 'Esports betting website.',
    logo: `resources://sponsors/${Constants.SponsorSlug.NINEKBET}.svg`,
  },
  {
    name: 'OwnerCard',
    slug: Constants.SponsorSlug.OWNERCARD,
    description: 'Payment company.',
    logo: `resources://sponsors/${Constants.SponsorSlug.OWNERCARD}.svg`,
  },
  {
    name: 'Prey',
    slug: Constants.SponsorSlug.PREY,
    description: 'Monitor, computer, and GPU producers.',
    logo: `resources://sponsors/${Constants.SponsorSlug}.svg`,
  },
  {
    name: 'SkinArch',
    slug: Constants.SponsorSlug.SKINARCH,
    description: 'CS skins website.',
    logo: `resources://sponsors/${Constants.SponsorSlug.SKINARCH}.svg`,
  },
  {
    name: 'White Wolf',
    slug: Constants.SponsorSlug.WHITE_WOLF,
    description: 'Energy drink company.',
    logo: `resources://sponsors/${Constants.SponsorSlug.WHITE_WOLF}.svg`,
  },
  {
    name: 'Ynfo',
    slug: Constants.SponsorSlug.YNFO,
    description: 'CPU processor brand.',
    logo: `resources://sponsors/${Constants.SponsorSlug.YNFO}.svg`,
  },
  {
    name: 'YTL',
    slug: Constants.SponsorSlug.YTL,
    description: 'Delivery company.',
    logo: `resources://sponsors/${Constants.SponsorSlug.YTL}.svg`,
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
  const transaction = data.map((sponsor) =>
    prisma.sponsor.upsert({
      where: { name: sponsor.name },
      update: sponsor,
      create: sponsor,
    }),
  );

  // run the transaction
  return prisma.$transaction(transaction);
}
