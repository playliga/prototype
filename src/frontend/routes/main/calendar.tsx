/**
 * Calendar route.
 *
 * @module
 */
import React from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Constants, Eagers, Util } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { cx } from '@liga/frontend/lib';
import { useTranslation } from '@liga/frontend/hooks';
import { Image } from '@liga/frontend/components';
import { FaArrowCircleLeft, FaArrowCircleRight, FaCalendarDay } from 'react-icons/fa';

/** @type {MatchesResponse} */
type MatchesResponse = Awaited<ReturnType<typeof api.matches.all<typeof Eagers.match>>>;

/** @constant */
const DAYS_PER_WEEK = 7;

/** @constant */
const WEEKS_PER_MONTH = 6;

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  // grab today's date
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const [current, setCurrent] = React.useState(state.profile?.date || new Date());
  const [spotlight, setSpotlight] = React.useState<MatchesResponse[number]>();
  const today = React.useMemo(() => state.profile?.date || new Date(), [state.profile]);

  // start and end of the month
  const start = React.useMemo(() => startOfMonth(current), [current]);
  const end = React.useMemo(() => endOfMonth(current), [current]);

  // actual days of the current month
  const days = React.useMemo(() => eachDayOfInterval({ start, end }), [start, end]);

  // grab the days of the week to render at the
  // top of the calendar ("sun", "mon", etc)
  const weekdays = React.useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(new Date()),
        end: endOfWeek(new Date()),
      }),
    [],
  );

  // padding for beginning and end of the month
  const paddingStart = React.useMemo(() => Array(getDay(start)).fill(null), [start]);
  const paddingEnd = React.useMemo(
    () => Array(42 - (paddingStart.length + days.length)).fill(null),
    [paddingStart, days],
  );

  // build the calendar data object
  const calendar = React.useMemo(
    () =>
      Array.from({ length: WEEKS_PER_MONTH }).map((_, weekIdx) =>
        [...paddingStart, ...days, ...paddingEnd].slice(
          weekIdx * DAYS_PER_WEEK,
          weekIdx * DAYS_PER_WEEK + DAYS_PER_WEEK,
        ),
      ),
    [paddingStart, days, paddingEnd],
  );

  // grab the match data for the current month
  const [matches, setMatches] = React.useState<MatchesResponse>([]);

  React.useEffect(() => {
    api.matches
      .all({
        ...Eagers.match,
        where: {
          date: {
            gte: start.toISOString(),
            lte: end.toISOString(),
          },
          competitors: {
            some: {
              teamId: state.profile?.teamId,
            },
          },
        },
      })
      .then(setMatches);
  }, [start, end, state.profile]);

  // load spotlight on initial fetch of matches
  React.useEffect(() => {
    const matchday = matches.find((match) => match.date.toISOString() === current.toISOString());

    if (spotlight || !matchday) {
      return;
    }

    setSpotlight(matchday);
  }, [matches]);

  return (
    <div className="dashboard">
      <header>
        <button
          disabled={start.toISOString() === startOfMonth(today).toISOString()}
          onClick={() => setCurrent(today)}
        >
          <FaCalendarDay />
          {'Today'}
        </button>
        <button onClick={() => setCurrent(subMonths(current, 1))}>
          <FaArrowCircleLeft />
          {'Previous'}
        </button>
        <button onClick={() => setCurrent(addMonths(current, 1))}>
          {'Next'}
          <FaArrowCircleRight />
        </button>
        <button className="ml-auto">{format(current, 'MMMM yyyy')}</button>
      </header>
      <main>
        <section>
          {(() => {
            if (!spotlight) {
              return (
                <article>
                  <header className="prose border-t-0!">
                    <h2>{format(current, 'PPP')}</h2>
                  </header>
                  <footer className="center h-24">
                    <p>Click on a date to view match details.</p>
                  </footer>
                </article>
              );
            }

            const opponent = spotlight.competitors.find(
              (competitor) => competitor.teamId !== state.profile.teamId,
            );

            return (
              <article className="stack-y">
                <header className="prose border-t-0!">
                  <h2>{format(spotlight.date, 'PPP')}</h2>
                </header>
                <footer className="stack-y divide-base-content/10 !gap-0 divide-y">
                  <aside className="stack-x items-center px-2">
                    <Image
                      className="size-16"
                      src={Util.getCompetitionLogo(
                        spotlight.competition.tier.slug,
                        spotlight.competition.federation.slug,
                      )}
                    />
                    <header>
                      <h3>{spotlight.competition.tier.league.name}</h3>
                      <h4>{Constants.IdiomaticTier[spotlight.competition.tier.slug]}</h4>
                      <h5>
                        {spotlight.competition.tier.groupSize
                          ? `${t('shared.matchday')} ${spotlight.round}`
                          : Util.parseCupRounds(spotlight.round, spotlight.totalRounds)}
                      </h5>
                    </header>
                  </aside>
                  <aside className="center gap-2 pb-2">
                    <header className="heading w-full border-t-0! py-2! text-center">
                      <p>{opponent.team.name}</p>
                    </header>
                    <Image
                      title={opponent.team.name}
                      src={opponent.team.blazon}
                      className="size-32"
                    />
                    {spotlight.status === Constants.MatchStatus.COMPLETED && (
                      <span
                        className={cx(
                          'badge',
                          ['badge-error', 'badge-ghost', 'badge-success'][opponent.result],
                        )}
                      >
                        {spotlight.competitors.map((competitor) => competitor.score).join('-')}
                      </span>
                    )}
                  </aside>
                  <aside className="join">
                    {!spotlight.competition.tier.groupSize && (
                      <button
                        className="btn join-item flex-1 rounded-none"
                        onClick={() => {
                          api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                            target: '/brackets',
                            payload: spotlight.competitionId,
                          });
                        }}
                      >
                        {t('main.dashboard.viewBracket')}
                      </button>
                    )}
                    <button
                      className="btn join-item flex-1 rounded-none"
                      disabled={!spotlight._count.events}
                      title={
                        spotlight._count.events > 0
                          ? t('shared.viewMatchDetails')
                          : t('shared.noMatchDetails')
                      }
                      onClick={() =>
                        spotlight._count.events > 0 &&
                        api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                          target: '/postgame',
                          payload: spotlight.id,
                        })
                      }
                    >
                      {t('shared.viewMatchDetails')}
                    </button>
                  </aside>
                </footer>
              </article>
            );
          })()}
        </section>
        <section>
          <table className="table-pin-rows table-xs table-zebra table h-full table-fixed">
            <thead>
              <tr>
                {weekdays.map((day) => (
                  <th key={day.toString()}>
                    <p className="uppercase">{format(day, 'EEE')}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendar.map((week, weekIdx) => (
                <tr key={weekIdx}>
                  {week.map((day: Date | null, dayIdx) => (
                    <td
                      key={day?.toString() || dayIdx + '__empty_day'}
                      className={cx(
                        'border-base-content/10 h-24 border align-top',
                        day?.toISOString() === today.toISOString() && 'bg-primary/10',
                        !!spotlight &&
                          day?.toISOString() === spotlight.date.toISOString() &&
                          'bg-base-300',
                      )}
                    >
                      {(() => {
                        if (!day) {
                          return <p />;
                        }

                        const matchday = matches.find(
                          (match) => match.date.toISOString() === day.toISOString(),
                        );

                        if (!matchday) {
                          return <h2>{day.getDate()}</h2>;
                        }

                        const opponent = matchday.competitors.find(
                          (competitor) => competitor.teamId !== state.profile.teamId,
                        );

                        return (
                          <div
                            className={cx('relative h-full w-full', !!opponent && 'cursor-pointer')}
                            onClick={() => !!opponent && setSpotlight(matchday)}
                          >
                            <h2>{day.getDate()}</h2>
                            <p>{Constants.IdiomaticTier[matchday.competition.tier.slug]}</p>
                            {!opponent && <p>BYE</p>}
                            {matchday.status === Constants.MatchStatus.COMPLETED && !!opponent && (
                              <span
                                className={cx(
                                  'badge badge-xs',
                                  ['badge-error', 'badge-ghost', 'badge-success'][opponent.result],
                                )}
                              >
                                {matchday.competitors
                                  .map((competitor) => competitor.score)
                                  .join('-')}
                              </span>
                            )}
                            {!!opponent && (
                              <img
                                title={opponent.team.name}
                                className="absolute right-0 bottom-0 size-12"
                                src={opponent.team.blazon}
                              />
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
