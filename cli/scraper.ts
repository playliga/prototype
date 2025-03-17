/**
 * Esports Data Scraper.
 *
 * @module
 */
import * as PandaScore from './generated/pandascore';
import util from 'node:util';
import log from 'electron-log';
import { camelCase, chunk, flatten, uniqBy, upperFirst } from 'lodash';
import { Command } from 'commander';
import { faker } from '@faker-js/faker';
import { Prisma, PrismaClient } from '@prisma/client';
import { Chance, Constants } from '@liga/shared';
import { CachedFetch } from '@liga/backend/lib';

/** @type {TeamAPIResponse} */
type TeamAPIResponse = PandaScore.components['schemas']['Team'];

/** @type {PlayerAPIResponse} */
type PlayerAPIResponse = PandaScore.components['schemas']['Player'];

/** @interface */
interface CLIArguments {
  batchLimit?: string;
  batchSize?: string;
  endpoint?: string;
  num?: string;
  offset?: string;
  token: string;
}

/**
 * Initialize the local prisma client.
 *
 * @constant
 */
const prisma = new PrismaClient();

/**
 * Default scraper arguments.
 *
 * @constant
 */
const DEFAULT_ARGS: CLIArguments = {
  batchLimit: '2',
  batchSize: '50',
  endpoint: 'https://api.pandascore.co',
  num: '2',
  offset: '1',
  token: '',
};

/**
 * Country weights per region.
 *
 * @constant
 */
const COUNTRY_WEIGHTS: Record<string, Record<string, number | 'auto'>> = {
  [Constants.FederationSlug.ESPORTS_AMERICAS]: {
    ar: 3,
    br: 10,
    ca: 30,
    cl: 2,
    co: 2,
    pe: 2,
    us: 51,
  },
  [Constants.FederationSlug.ESPORTS_EUROPA]: {
    al: 1,
    be: 3,
    bg: 1,
    ch: 4,
    cz: 4,
    de: 6,
    dk: 9,
    ee: 2,
    es: 2,
    fi: 8,
    fr: 5,
    gb: 9,
    gr: 1,
    hr: 1,
    hu: 1,
    ie: 1,
    it: 2,
    kr: 1,
    lt: 1,
    lv: 1,
    nl: 1,
    no: 3,
    nz: 4,
    pl: 4,
    pt: 1,
    sa: 1,
    se: 8,
    sk: 1,
    ro: 1,
    rs: 4,
    ru: 4,
    ua: 4,
    za: 1,
  },
};

/**
 * Builds Prisma payload objects from either an array of
 * teams or an array of players.
 *
 * Additionally, this function randomly assigns countries
 * to the payload by evenly splitting the data among the
 * known federations and their continents.
 *
 * @function
 * @param data The data to process.
 */
async function buildPrismaPayload(data: Array<TeamAPIResponse | PlayerAPIResponse>) {
  // grab all federations
  const federations = await prisma.federation.findMany({
    where: {
      slug: {
        in: Object.keys(COUNTRY_WEIGHTS),
      },
    },
    include: { continents: { include: { countries: true } } },
  });

  // prepare the payload object
  const payload: Array<Prisma.TeamUpsertArgs | Prisma.PlayerCreateArgs> = [];

  // chunk the data evenly into federations
  chunk(data, Math.floor(data.length / federations.length)).forEach((chunkData, chunkIdx) => {
    // bail early if the federation could not be found
    const federation = federations[chunkIdx];

    if (!federation) {
      return;
    }

    // build probability table for the country
    const countries = flatten(federation.continents.map((continent) => continent.countries));
    const countryPbx = COUNTRY_WEIGHTS[federation.slug];

    for (const country of countries) {
      if (country.code.toLowerCase() in countryPbx) {
        continue;
      }

      countryPbx[country.code] = 'auto';
    }

    // generate the prisma payloads
    chunkData.forEach((item) => {
      // create team payload
      if ('players' in item) {
        return payload.push({
          where: { slug: item.slug },
          update: {},
          create: {
            name: item.name,
            slug: item.slug,
            countryId: (() => {
              const countryPick = Chance.roll(countryPbx);
              return countries.find(
                (country) => country.code.toLowerCase() === countryPick.toLowerCase(),
              ).id;
            })(),
            players: {
              create: item.players.map((player) => ({
                name: player.name,
                countryId: (() => {
                  const countryPick = Chance.roll(countryPbx);
                  return countries.find(
                    (country) => country.code.toLowerCase() === countryPick.toLowerCase(),
                  ).id;
                })(),
              })),
            },
            personas: {
              create: [
                {
                  name: `${faker.name.firstName()} ${faker.name.lastName()}`,
                  role: Constants.PersonaRole.MANAGER,
                },
              ],
            },
          },
        });
      }

      // otherwise create player payload
      payload.push({
        data: {
          name: item.name,
          transferListed: true,
          countryId: (() => {
            const countryPick = Chance.roll(countryPbx);
            return countries.find(
              (country) => country.code.toLowerCase() === countryPick.toLowerCase(),
            ).id;
          })(),
        },
      });
    });
  });

  return Promise.resolve(payload);
}

/**
 * Teams scraper subcommand.
 *
 * Loops over the Esports API until it either reaches the
 * specified number of teams to generate, or reaches
 * the maximum amount of tries allowed.
 *
 * @function
 * @param args CLI args.
 */
async function scrapeTeams(args: typeof DEFAULT_ARGS) {
  let teams: TeamAPIResponse[] = [];
  let currPage = parseInt(args.offset);

  // keep scraping until we reach our intended
  // num of teams or reach our iteration limit
  while (
    teams.length <= parseInt(args.num) &&
    currPage <= parseInt(args.batchLimit) + parseInt(args.offset)
  ) {
    log.info('Total Teams: %d', teams.length);
    log.info('Fetching Page: %d', currPage);
    log.info(
      'Attempts Remaining: %d',
      parseInt(args.batchLimit) + parseInt(args.offset) - currPage,
    );

    const opts = {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${args.token}`,
      },
    };
    const url =
      args.endpoint +
      '/csgo/teams?' +
      new URLSearchParams({
        page: currPage.toString(),
        per_page: args.batchSize,
      });

    try {
      const currBatch: TeamAPIResponse[] = await CachedFetch.get(url, opts);
      teams = uniqBy([...teams, ...currBatch.filter((team) => team.players.length >= 5)], 'name');
    } finally {
      currPage += 1;
    }
  }

  // save the teams to the db
  const prismaPayload = (await buildPrismaPayload(teams)) as Array<Prisma.TeamUpsertArgs>;
  const queries = prismaPayload.map((payload) => prisma.team.upsert(payload));
  await prisma.$transaction(queries);
  return Promise.resolve();
}

/**
 * Free Agents scraper subcommand.
 *
 * Loops over the Esports API until it either reaches the
 * specified number of free agents to generate or reaches
 * the maximum amount of tries allowed.
 *
 * @function
 * @param args CLI args.
 */
async function scrapeFreeAgents(args: typeof DEFAULT_ARGS) {
  let players: PlayerAPIResponse[] = [];
  let currPage = parseInt(args.offset);

  // keep scraping until we reach our intended num
  // of players or reach our iteration limit
  while (
    players.length <= parseInt(args.num) &&
    currPage <= parseInt(args.batchLimit) + parseInt(args.offset)
  ) {
    log.info('Total Players: %d', players.length);
    log.info('Fetching Page: %d', currPage);
    log.info(
      'Attempts Remaining: %d',
      parseInt(args.batchLimit) + parseInt(args.offset) - currPage,
    );

    const opts = {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${args.token}`,
      },
    };
    const url =
      args.endpoint +
      '/players?' +
      new URLSearchParams({
        page: currPage.toString(),
        per_page: args.batchSize,
      });
    const resp = await fetch(url, opts);
    const currBatch: PlayerAPIResponse[] = await resp.json();

    players = uniqBy([...players, ...currBatch], 'name');
    currPage += 1;
  }

  // save the players to the db
  const prismaPayload = (await buildPrismaPayload(players)) as Array<Prisma.PlayerCreateArgs>;
  const queries = prismaPayload.map((payload) => prisma.player.create(payload));
  await prisma.$transaction(queries);
  return Promise.resolve();
}

/**
 * Scrapes the PandaScore Esports API.
 *
 * @function
 * @param type The type of scraper to run.
 * @param args CLI args.
 */
export async function scrape(type: string, args: typeof DEFAULT_ARGS) {
  // bail early if provided scraper
  // type is not supported
  const acceptedScraperTypes = ['teams', 'free-agents'];
  const scraperFns: Record<string, typeof scrapeTeams | typeof scrapeFreeAgents> = {
    scrapeTeams,
    scrapeFreeAgents,
  };

  if (!acceptedScraperTypes.includes(type)) {
    return Promise.reject('Unknown scraper type.');
  }

  // dynamically call the scraper function
  try {
    const scraperFn = util.format('scrape%s', upperFirst(camelCase(type)));
    await scraperFns[scraperFn]({ ...DEFAULT_ARGS, ...args });
    return prisma.$disconnect();
  } catch (error) {
    log.error(error);
    return prisma.$disconnect();
  }
}

/**
 * Exports this module.
 *
 * @exports
 */
export default {
  /**
   * Registers this module's CLI.
   *
   * @function
   * @param program CLI parser.
   */
  register: (program: Command) => {
    program
      .command('scraper')
      .description('Generate teams data using Pandascore Esports API')
      .argument('<type>', 'The type of scraper to use')
      .requiredOption('-t --token <token>', 'Pandascore Access Token')
      .option(
        '--batch-limit <limit>',
        'How many iterations to attempt before giving up',
        DEFAULT_ARGS.batchLimit,
      )
      .option(
        '-b --batch-size <size>',
        'How many items to process per iteration',
        DEFAULT_ARGS.batchLimit,
      )
      .option('-e --endpoint <url>', 'Pandascore API Endpoint', DEFAULT_ARGS.endpoint)
      .option('-n --num <num>', 'The number of teams to generate', DEFAULT_ARGS.num)
      .option('-o --offset <num>', 'The page to start scraping from.', DEFAULT_ARGS.offset)
      .action(scrape);
  },
};
