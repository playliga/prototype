/**
 * Competition overview route.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { format } from 'date-fns';
import { groupBy } from 'lodash';
import { useOutletContext } from 'react-router-dom';
import { Constants, Eagers, Util } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { Standings } from '@liga/frontend/components';
import { FaChartBar } from 'react-icons/fa';

/** @constant */
const NUM_PREVIOUS = 5;

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const { state } = React.useContext(AppStateContext);
  const { competition } = useOutletContext<RouteContextCompetitions>();
  const [competitionDates, setCompetitionDates] = React.useState<
    Array<Awaited<ReturnType<typeof api.calendar.find>>>
  >([]);
  const [matches, setMatches] = React.useState<
    Awaited<ReturnType<typeof api.matches.all<typeof Eagers.match>>>
  >([]);
  const [selectedGroup, setSelectedGroup] = React.useState<number>();
  const [winners, setWinners] = React.useState<
    Awaited<ReturnType<typeof api.competitions.winners>>
  >([]);

  // fetch competition start and end
  // dates when the data comes in
  React.useEffect(() => {
    Promise.all([
      api.calendar.find({
        where: {
          type: Constants.CalendarEntry.COMPETITION_START,
          payload: String(competition.id),
        },
      }),
      api.calendar.find({
        where: {
          type: Constants.CalendarEntry.COMPETITION_END,
          payload: String(competition.id),
        },
      }),
    ]).then(setCompetitionDates);
  }, [competition]);

  // fetch recent match results
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    api.matches
      .all({
        include: Eagers.match.include,
        take: NUM_PREVIOUS,
        orderBy: {
          date: 'desc',
        },
        where: {
          status: Constants.MatchStatus.COMPLETED,
          competition: {
            id: competition.id,
          },
          date: {
            lte: state.profile.date.toISOString(),
          },
        },
      })
      .then(setMatches);
  }, [competition, state.profile]);

  // fetch previous winners
  React.useEffect(() => {
    api.competitions.winners(competition.id).then(setWinners);
  }, [competition]);

  // reset group selection when competition changes
  React.useEffect(() => {
    setSelectedGroup(null);
  }, [competition]);

  // grab user's team info
  const userTeam = React.useMemo(
    () => competition.competitors.find((competitor) => competitor.teamId === state.profile.teamId),
    [competition, state.profile],
  );

  // grab group to highlight
  const group = React.useMemo(
    () =>
      competition.competitors.filter(
        (competitor) => competitor.group === (selectedGroup || userTeam?.group || 1),
      ),
    [competition, userTeam, selectedGroup],
  );

  // filler for previous matches
  const previousFiller = React.useMemo(
    () => [...Array(Math.max(0, NUM_PREVIOUS - matches.length))],
    [matches.length],
  );

  return (
    <section className="grid grid-cols-2 divide-x divide-base-content/10">
      <article>
        <aside>
          <header className="heading prose max-w-none !border-t-0">
            <h2>Overview</h2>
          </header>
          <table className="table table-fixed">
            <thead>
              <tr>
                <th colSpan={2}>Name</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2}>
                  {competition.federation.slug === Constants.FederationSlug.ESPORTS_WORLD
                    ? `${competition.tier.league.name}: ${Constants.IdiomaticTier[competition.tier.slug]}`
                    : `${competition.federation.name}: ${Constants.IdiomaticTier[competition.tier.slug]}`}
                </td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{competitionDates[0] ? format(competitionDates[0].date, 'PPPP') : 'TBD'}</td>
                <td>{competitionDates[1] ? format(competitionDates[1].date, 'PPPP') : '-'}</td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th>Title Holders</th>
                <th>Season</th>
              </tr>
            </thead>
            <tbody>
              {!winners.length && (
                <tr>
                  <td>N/A</td>
                  <td>-</td>
                </tr>
              )}
              {winners.length > 0 && (
                <tr>
                  <td>{winners[0].team.name}</td>
                  <td>Season {competition.season - 1}</td>
                </tr>
              )}
            </tbody>
          </table>
        </aside>
        <aside>
          <header className="heading prose max-w-none !border-t-0">
            <h2>Recent Match Results</h2>
          </header>
          <table className="table table-fixed">
            <thead>
              <tr>
                <th title="Match Details" className="w-1/12" />
                <th className="w-1/12 text-center">Date</th>
                <th className="w-4/12 text-right">Home</th>
                <th className="w-2/12 text-center">Score</th>
                <th className="w-4/12">Away</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
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
                    className={cx(onClick && 'cursor-pointer hover:bg-base-content/10')}
                  >
                    <td
                      className={cx(!onClick && 'text-muted')}
                      title={onClick ? 'View Match Details' : 'No Match Details'}
                    >
                      <FaChartBar className="mx-auto" />
                    </td>
                    <td title={format(match.date, 'PPPP')} className="text-center">
                      {format(match.date, 'MM/dd')}
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
                  </tr>
                );
              })}
              {previousFiller.map((_, idx) => (
                <tr key={`${idx}__filler_match_previous`} className="text-muted">
                  <td className="w-1/12" />
                  <td className="w-1/12 text-center">-</td>
                  <td colSpan={3} className="w-10/12 text-center">
                    No Recent Match
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
        <aside>
          <header className="heading prose max-w-none">
            <h2>Past Winners</h2>
          </header>
          <table className="table table-fixed">
            <thead>
              <tr>
                <th>Name</th>
                <th>Season</th>
              </tr>
            </thead>
            <tbody>
              {!winners.length && (
                <tr>
                  <td>N/A</td>
                  <td>-</td>
                </tr>
              )}
              {winners.map((winner, idx) => (
                <tr key={winner.id + '__winner'}>
                  <td>{winner.team.name}</td>
                  <td>Season {competition.season - (idx + 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </article>
      <article>
        <header className="heading prose max-w-none !border-t-0">
          <h2>Standings</h2>
        </header>
        <select
          className={cx(
            'select w-full border-0 border-b border-base-content/10 bg-base-200',
            'focus:border-0 focus:border-b disabled:bg-base-200 disabled:text-opacity-100',
          )}
          onChange={(event) => setSelectedGroup(Number(event.target.value))}
          value={selectedGroup || userTeam?.group || -1}
          disabled={!competition.competitors.some((competitor) => competitor.group > 1)}
        >
          {!group.length && (
            <option disabled value={-1}>
              Competition not started.
            </option>
          )}
          {competition.tier.league.slug === Constants.LeagueSlug.ESPORTS_LEAGUE ? (
            <option>{Constants.IdiomaticTier[competition.tier.slug]}</option>
          ) : (
            Object.keys(groupBy(competition.competitors, 'group')).map((groupKey) => (
              <option key={groupKey + '__select'} value={groupKey}>
                Group {Util.toAlpha(groupKey)}
              </option>
            ))
          )}
        </select>
        <Standings
          highlight={state.profile.teamId}
          competitors={group}
          zones={
            competition.status === Constants.CompetitionStatus.STARTED &&
            competition.tier.groupSize &&
            (Constants.TierZones[competition.tier.slug] || Constants.TierZones.default)
          }
        />
      </article>
    </section>
  );
}
