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
import { AutofillEntry, Prisma, Team } from '@prisma/client';
import { Constants, Eagers } from '@liga/shared';

/** @type {AutofillEagerPayload} */
type AutofillEagerPayload = Prisma.AutofillGetPayload<typeof Eagers.autofill>;

/**
 * Include only teams that meet the specific criteria.
 *
 * @param entry   The autofill entry.
 * @param parent  The autofill item.
 * @function
 */
async function handleIncludeAction(
  entry: AutofillEntry,
  parent: AutofillEagerPayload,
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
        slug: entry.federationSlug || parent.federation.slug,
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
    Math.max(0, entry.start - 1),
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
async function handleExcludeAction(entry: AutofillEntry) {
  // e.g.: ignore top 3 of last season's major
  return Promise.resolve([]);
}

/**
 * An include action that is used to backfill the teams list.
 *
 * @param entry   The autofill entry.
 * @param parent  The autofill item.
 * @function
 */
async function handleFallbackAction(entry: AutofillEntry, parent: AutofillEagerPayload) {
  const teams = await DatabaseClient.prisma.team.findMany({
    where: {
      prestige: Constants.Prestige.findIndex((prestige) => prestige === entry.target),
      country: {
        continent: {
          federation: {
            slug: entry.federationSlug || parent.federation.slug,
          },
        },
      },
    },
  });

  if (!teams.length) {
    log.warn(
      'Could not backfill %s - %s. Found %d teams.',
      parent.federation.name,
      parent.tier.name,
      teams.length,
    );
  }

  return teams.slice(Math.max(0, entry.start - 1), entry.end || undefined);
}

/**
 * Parses the autofill syntax logic.
 *
 * @param item  The autofill item.
 * @function
 */
export async function parse(item: AutofillEagerPayload) {
  // fill competitors list using this autofill item's entries
  const competitors = [] as Array<Team>;

  // collect competitors
  const includeList = await Promise.all(
    flatten(
      item.entries
        .filter((entry) => entry.action === Constants.AutofillAction.INCLUDE)
        .map((entry) => handleIncludeAction(entry, item)),
    ),
  );

  // exclude undesirables
  const excludeList = await Promise.all(
    flatten(
      item.entries
        .filter((entry) => entry.action === Constants.AutofillAction.EXCLUDE)
        .map(handleExcludeAction),
    ),
  );

  // create unique list of competitors by
  // filtering out the excludes
  competitors.push(...xorBy(flatten(includeList), flatten(excludeList), 'id'));

  // if the required quota for the current tier is not met then
  // use the fallback entries to backfill the competitors list
  const quota = item.entries
    .filter((entry) => entry.action === Constants.AutofillAction.INCLUDE)
    .map((entry) => (entry.end || item.tier.size) - Math.max(0, entry.start - 1))
    .reduce((a, b) => a + b, 0);

  if (!quota || competitors.length < quota) {
    const fallbackList = flatten(
      await Promise.all(
        item.entries
          .filter((entry) => entry.action === Constants.AutofillAction.FALLBACK)
          .map((entry) => handleFallbackAction(entry, item)),
      ),
    );
    competitors.push(...differenceBy(fallbackList, competitors, 'id'));
  }

  log.info(
    'Autofilled %s - %s with %d teams',
    item.federation.name,
    item.tier.name,
    competitors.slice(0, item.tier.size).length,
  );

  // return our payload
  return Promise.resolve(competitors.slice(0, item.tier.size));
}
