/**
 * Team match results route.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { random } from 'lodash';
import { format } from 'date-fns';
import { useOutletContext } from 'react-router-dom';
import { Constants, Eagers, Util } from '@liga/shared';
import { useTranslation } from '@liga/frontend/hooks';
import { Pagination } from '@liga/frontend/components';
import { FaChartBar, FaSortAmountDown, FaSortAmountDownAlt } from 'react-icons/fa';

/** @constant */
const NUM_COLUMNS = 7;

/** @constant */
const PAGE_SIZE = 50;

/**
 * @param match The match database record.
 * @function
 */
function getCompetitionLabel(
  match: Awaited<ReturnType<typeof api.matches.all<typeof Eagers.match>>>[number],
) {
  const tier = Constants.IdiomaticTier[match.competition.tier.slug];
  const suffix =
    match.competition.tier.groupSize === null
      ? ' ' + Util.parseCupRounds(match.round, match.totalRounds)
      : '';
  switch (match.competition.tier.league.slug) {
    case Constants.LeagueSlug.ESPORTS_WORLD_CUP:
      return `${match.competition.tier.league.name} ${tier}${suffix}`;
    case Constants.LeagueSlug.ESPORTS_CIRCUIT:
      return `${match.competition.tier.league.name} ${tier}${suffix}`;
    default:
      return `${match.competition.federation.name} ${tier}${suffix}`;
  }
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const t = useTranslation('windows');
  const { team } = useOutletContext<RouteContextTeams>();
  const [matches, setMatches] = React.useState<
    Awaited<ReturnType<typeof api.matches.all<typeof Eagers.match>>>
  >([]);
  const [numMatches, setNumMatches] = React.useState(0);
  const [numPage, setNumPage] = React.useState(1);
  const [orderBy, setOrderBy] = React.useState<
    ExtractBaseType<Parameters<typeof api.matches.all>[number]['orderBy']>
  >({ date: 'desc' });
  const [working, setWorking] = React.useState(false);

  // build query information
  const totalPages = React.useMemo(() => Math.ceil(numMatches / PAGE_SIZE), [numMatches]);
  const matchesQuery: Parameters<typeof api.matches.all>[number] = React.useMemo(
    () => ({
      ...Eagers.match,
      ...(orderBy ? { orderBy } : {}),
      where: {
        status: Constants.MatchStatus.COMPLETED,
        competitors: {
          some: {
            teamId: team.id,
          },
        },
      },
    }),
    [team, orderBy],
  );

  // resets the page to a random negative number
  // in order to trigger a new data fetch
  const triggerMatchesFetch = () => setNumPage(-random(255));

  // initial data fetch
  React.useEffect(() => {
    api.matches.count(matchesQuery.where).then(setNumMatches);
  }, []);

  // reset page when changing sorting direction
  React.useEffect(triggerMatchesFetch, [orderBy, team]);

  // apply matches filters
  React.useEffect(() => {
    setWorking(true);
    api.matches.count(matchesQuery.where).then(setNumMatches);
    api.matches
      .all({
        ...matchesQuery,
        take: PAGE_SIZE,
        skip: PAGE_SIZE * ((numPage <= 0 ? 1 : numPage) - 1),
        include: Eagers.match.include,
      })
      .then((result) => Promise.resolve(setMatches(result)))
      .then(() => setWorking(false));
  }, [numPage]);

  // quick hack to bypass row height behavior where they
  // try to fill in the remaining height of the table
  const filler = React.useMemo(
    () =>
      matches.length < PAGE_SIZE
        ? [...Array(PAGE_SIZE - matches.length - 1)].map((_, idx) => idx)
        : [],
    [matches],
  );

  return (
    <section>
      <table className="table-pin-rows table-xs table h-full table-fixed">
        <thead>
          <tr>
            <th className="w-1/12 text-center">{t('shared.matchDetails')}</th>
            <th
              className="hover:bg-base-300 w-1/12 cursor-pointer"
              onClick={() => setOrderBy(Util.parseSortingDirection('date', orderBy?.date))}
            >
              <header className="flex items-center justify-center gap-2">
                {t('shared.date')}
                <span className={cx(orderBy?.date && 'text-primary')}>
                  {orderBy?.date === 'desc' ? <FaSortAmountDown /> : <FaSortAmountDownAlt />}
                </span>
              </header>
            </th>
            <th className="w-2/12 text-right">{t('shared.home')}</th>
            <th className="w-1/12 text-center">{t('shared.score')}</th>
            <th className="w-2/12">{t('shared.away')}</th>
            <th className="w-4/12">{t('shared.competition')}</th>
            <th className="w-1/12 text-center">{t('shared.season')}</th>
          </tr>
        </thead>
        <tbody>
          {!!working && (
            <tr>
              <td colSpan={NUM_COLUMNS} className="text-center">
                <span className="loading loading-bars loading-lg" />
              </td>
            </tr>
          )}
          {!working &&
            matches.map((match) => {
              const [home, away] = match.competitors;
              const onClick =
                match._count.events > 0
                  ? () =>
                      api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                        target: '/postgame',
                        payload: match.id,
                      })
                  : null;

              return (
                <tr
                  key={match.id + match.date.toDateString() + '__match'}
                  onClick={onClick}
                  className={cx(onClick && 'hover:bg-base-content/10 cursor-pointer')}
                >
                  <td
                    className={cx(!onClick && 'text-muted')}
                    title={onClick ? t('shared.viewMatchDetails') : t('shared.noMatchDetails')}
                  >
                    <FaChartBar className="mx-auto" />
                  </td>
                  <td title={format(match.date, 'PPPP')} className="text-center">
                    {format(match.date, Constants.Application.CALENDAR_DATE_FORMAT)}
                  </td>
                  <td className="truncate text-right" title={home.team.name}>
                    <span>{home.team.name}</span>
                    <img src={home.team.blazon} className="ml-2 inline-block size-4" />
                  </td>
                  <td className="text-center">
                    {!away && '-'}
                    {!!away && (
                      <article className="stack-x justify-center">
                        <span className={Util.getResultTextColor(home.result)}>{home.score}</span>
                        <span>-</span>
                        <span className={Util.getResultTextColor(away.result)}>{away.score}</span>
                      </article>
                    )}
                  </td>
                  <td className="truncate" title={away?.team.name || 'BYE'}>
                    {!away && 'BYE'}
                    {!!away && (
                      <>
                        <img src={away.team.blazon} className="mr-2 inline-block size-4" />
                        <span>{away.team.name}</span>
                      </>
                    )}
                  </td>
                  <td className="truncate" title={getCompetitionLabel(match)}>
                    {getCompetitionLabel(match)}
                  </td>
                  <td className="text-center">
                    {t('shared.season')} {match.competition.season}
                  </td>
                </tr>
              );
            })}
          {!working &&
            !!filler.length &&
            filler.map((_, idx) => (
              <tr key={`${idx}__filler`}>
                <td colSpan={NUM_COLUMNS}>&nbsp;</td>
              </tr>
            ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={NUM_COLUMNS - 1} className="p-0 font-mono">
              <Pagination
                numPage={numPage}
                totalPages={totalPages}
                onChange={setNumPage}
                onClick={setNumPage}
              />
            </th>
            <th className="text-right font-mono">
              {numMatches} {t('shared.results')}
            </th>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
