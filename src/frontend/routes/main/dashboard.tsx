/**
 * The main browser window dashboard.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { addDays, format } from 'date-fns';
import { Constants, Eagers, Util } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { workingUpdate } from '@liga/frontend/redux/actions';
import { Standings, Image, Historial } from '@liga/frontend/components';
import {
  FaCalendarDay,
  FaChartBar,
  FaCloudMoon,
  FaCog,
  FaExclamationTriangle,
  FaForward,
  FaMapSigns,
} from 'react-icons/fa';

/** @constant */
const GAME_LAUNCH_DELAY = 1000;

/** @constant */
const NUM_UPCOMING = 5 + 1; // adds an extra for "next match"

/** @constant */
const NUM_PREVIOUS = 5;

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const { state, dispatch } = React.useContext(AppStateContext);
  const [playing, setPlaying] = React.useState(false);
  const [settings, setSettings] = React.useState(Constants.Settings);
  const [upcoming, setUpcoming] = React.useState<
    Awaited<ReturnType<typeof api.matches.upcoming<typeof Eagers.match>>>
  >([]);
  const [matchHistorial, setMatchHistorial] = React.useState<Array<typeof upcoming>>([[], []]);
  const [previous, setPrevious] = React.useState<typeof upcoming>([]);

  // load settings
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    setSettings(Util.loadSettings(state.profile.settings));
  }, [state.profile]);

  // fetch upcoming list of matches
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    api.matches.upcoming(Eagers.match, NUM_UPCOMING).then(setUpcoming);
  }, [state.profile]);

  // fetch match historial for match preview
  React.useEffect(() => {
    const [nextMatch] = upcoming.slice(0, 1);

    if (!nextMatch) {
      return;
    }

    Promise.all(
      nextMatch.competitors.map((competitor) =>
        api.matches.previous(Eagers.match, competitor.teamId),
      ),
    ).then(setMatchHistorial);
  }, [upcoming]);

  // fetch previous matches if no upcoming matches
  React.useEffect(() => {
    const [nextMatch] = upcoming.slice(0, 1);

    if (nextMatch || !state.profile) {
      return;
    }

    api.matches.previous(Eagers.match, state.profile.teamId).then(setPrevious);
  }, [upcoming, state.profile]);

  // fill in rows if not enough upcoming matches
  const upcomingFiller = React.useMemo(
    () => [...Array(Math.max(0, NUM_UPCOMING - (upcoming.length || 1)))],
    [upcoming],
  );

  // check if its matchday
  const isMatchday = React.useMemo(
    () =>
      state.profile &&
      upcoming.length &&
      upcoming[0]?.date.toISOString() === state.profile.date.toISOString(),
    [upcoming, state.profile],
  );

  // grab next match info
  const [spotlight] = React.useMemo(() => upcoming.slice(0, 1), [upcoming]);

  // grab standings info
  const [standings] = React.useMemo(
    () => (spotlight ? upcoming.slice(0, 1) : previous),
    [spotlight, previous],
  );

  // grab user's team info
  const userTeam = React.useMemo(
    () =>
      !!standings &&
      standings.competition.competitors.find(
        (competitor) => competitor.teamId === state.profile.teamId,
      ),
    [standings, state.profile],
  );

  // grab competitors by user's group
  const userGroupCompetitors = React.useMemo(
    () =>
      !!standings &&
      !!standings.competition.tier.groupSize &&
      standings.competition.competitors
        .filter((competitor) => competitor.group === userTeam.group)
        .sort((a, b) => a.position - b.position),
    [standings, userTeam],
  );

  // start the engine loop
  const startEngineLoop = async (days?: number) => {
    dispatch(workingUpdate(true));
    await api.calendar.start(days);
    dispatch(workingUpdate(false));
    return Promise.resolve();
  };

  // figure out which game is not installed
  const appStatusError = React.useMemo(() => {
    const [, match] = state.appStatus?.match(/((?:csgo|hl|hl2|vpk)\.exe)/) || [];
    return match;
  }, [state.appStatus]);

  return (
    <div className="dashboard">
      {/** PLAYING MODAL */}
      <dialog className={cx('modal', 'absolute', 'w-screen', playing && 'modal-open')}>
        <section className="modal-box">
          <h3 className="text-lg">Playing Match</h3>
          <p className="py-4">This modal will automatically close once your match is completed.</p>
        </section>
      </dialog>

      {/** SETTINGS VALIDATION WARNING BANNER */}
      {(!!appStatusError || state.appStatus?.includes('plugins')) && (
        <section className="alert alert-warning flex h-8 justify-center rounded-none p-0">
          <FaExclamationTriangle />
          {!!Constants.GameSettings.CS16_EXE.includes(appStatusError) && (
            <p>
              Counter-Strike 1.6 not detected! Please install in order to play your matches in-game.
            </p>
          )}
          {!!Constants.GameSettings.CSSOURCE_EXE.includes(appStatusError) && (
            <p>
              Counter-Strike Source not detected! Please install in order to play your matches
              in-game.
            </p>
          )}
          {!!Constants.GameSettings.CSGO_EXE.includes(appStatusError) && (
            <React.Fragment>
              <p>CS:GO not detected! Enable CS:GO Legacy version from the Betas tab.</p>
              <button
                className="btn btn-neutral btn-sm rounded-none"
                onClick={() => {
                  api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                    target: '/markdown/' + appStatusError,
                  });
                }}
              >
                Details
              </button>
            </React.Fragment>
          )}
          {!!Constants.GameSettings.CS2_VPK_EXE.includes(appStatusError) && (
            <React.Fragment>
              <p>CS:GO SDK not detected! Please download the CS:GO SDK in order to play CS2.</p>
              <button
                className="btn btn-neutral btn-sm rounded-none"
                onClick={() => {
                  api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                    target: '/markdown/' + appStatusError,
                  });
                }}
              >
                Details
              </button>
            </React.Fragment>
          )}
          {!!state.appStatus?.includes('plugins') && (
            <p>
              Game plugins not installed! You will not be able to launch any games. Try restarting
              the app to fix this issue.
            </p>
          )}
        </section>
      )}

      {/** MAIN CONTENT */}
      <main>
        {/** LEFT COLUMN */}
        <div className="stack-y !gap-0">
          <section className="stack-y !gap-0">
            <header className="prose !border-t-0">
              <h2>Upcoming Matches</h2>
            </header>
            <table className="table table-fixed">
              <tbody>
                {upcoming.slice(1, NUM_UPCOMING).map((match) => {
                  const opponent = match.competitors.find(
                    (competitor) => competitor.teamId !== state.profile.teamId,
                  );
                  return (
                    <tr key={`${match.id}__match_upcoming`}>
                      <td className="w-1/6" title={format(match.date, 'PPPP')}>
                        {format(match.date, 'MM/dd')}
                      </td>
                      <td className="w-3/6 truncate" title={opponent?.team.name || '-'}>
                        <img
                          src={opponent?.team.blazon || 'resources://blazonry/009400.png'}
                          className="mr-2 inline-block size-4"
                        />
                        <span>{opponent?.team.name || '-'}</span>
                      </td>
                      <td
                        className="w-2/6 truncate"
                        title={`${match.competition.tier.league.name}: ${Constants.IdiomaticTier[match.competition.tier.slug]}`}
                      >
                        {Constants.IdiomaticTier[match.competition.tier.slug]}
                      </td>
                    </tr>
                  );
                })}
                {upcomingFiller.map((_, idx) => (
                  <tr key={`${idx}__filler_match_upcoming`} className="text-muted">
                    <td className="w-1/6">
                      {state.profile
                        ? format(
                            addDays(
                              !upcoming.length ? state.profile.date : upcoming.slice(-1)[0].date,
                              idx + 1,
                            ),
                            'MM/dd',
                          )
                        : '-'}
                    </td>
                    <td className="w-3/6 truncate">No Match Scheduled</td>
                    <td className="w-2/6">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="stack-y !gap-0">
            <header className="prose">
              <h2>Standings</h2>
            </header>
            {!standings && (
              <article key="empty__standings" className="card h-32 rounded-none">
                <aside className="card-body items-center justify-center">
                  <p className="flex-grow-0">It's quiet... too quiet.</p>
                </aside>
              </article>
            )}
            {!!standings &&
              (() => {
                if (standings.competition.tier.groupSize) {
                  return (
                    <Standings
                      compact
                      highlight={state.profile.teamId}
                      // offset={userGroupCompetitors.length > 10 && userTeam.position > 10 && 10}
                      // limit={10}
                      competitors={userGroupCompetitors}
                      title={
                        standings.competition.tier.league.slug ===
                        Constants.LeagueSlug.ESPORTS_LEAGUE
                          ? Constants.IdiomaticTier[standings.competition.tier.slug]
                          : `Group ${Util.toAlpha(userTeam.group)}`
                      }
                      zones={
                        standings.competition.status === Constants.CompetitionStatus.STARTED &&
                        (Constants.TierZones[standings.competition.tier.slug] ||
                          Constants.TierZones.default)
                      }
                    />
                  );
                }

                return (
                  <article className="stack-y !gap-4 divide-y divide-base-content/10 pb-2">
                    <header className="text-center">
                      <h2>{standings.competition.tier.league.name}</h2>
                      <h3>{Constants.IdiomaticTier[standings.competition.tier.slug]}</h3>
                      <p>{Util.parseCupRounds(standings.round, standings.totalRounds)}</p>
                    </header>
                    <aside className="grid grid-cols-2 place-items-center pt-4">
                      {standings.competitors.map((competitor) => (
                        <img
                          key={`${competitor.id}__cup_splotlight`}
                          title={competitor.team.name}
                          src={competitor.team.blazon}
                          className="size-32"
                        />
                      ))}
                    </aside>
                    <footer className="text-center">
                      <button
                        className="btn btn-block"
                        onClick={() => {
                          api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                            target: '/brackets',
                            payload: standings.competitionId,
                          });
                        }}
                      >
                        View Bracket
                      </button>
                    </footer>
                  </article>
                );
              })()}
          </section>
        </div>

        {/** RIGHT COLUMN */}
        <div className="stack-y !gap-0">
          <section className="grid grid-cols-6 divide-x divide-base-content/10">
            <button
              title="Advance Calendar"
              className="day day-btn border-t-0"
              disabled={!state.profile || state.working || isMatchday}
              onClick={() => !state.working && !isMatchday && startEngineLoop()}
            >
              <figure>
                <FaForward />
              </figure>
            </button>
            {!state.profile &&
              [...Array(5)].map((_, idx) => (
                <article
                  key={`${idx}__calendar_loading`}
                  className="day h-32 items-center justify-center border-t-0"
                >
                  <span className="loading loading-spinner loading-sm" />
                </article>
              ))}
            {!!state.profile &&
              [...Array(5)].map((_, idx) => {
                const today = addDays(state.profile.date, idx);
                const isActive = idx === 0;
                const entry = upcoming.find(
                  (match) => match.date.toISOString() === today.toISOString(),
                );
                const opponent = entry?.competitors?.find(
                  (competitor) => competitor.teamId !== state.profile.teamId,
                );

                return (
                  <article
                    key={`${idx}__calendar`}
                    className={cx('day border-t-0', isActive && 'day-active')}
                  >
                    <figure>
                      {isActive && (
                        <React.Fragment>
                          <p>{format(today, 'MMM')}</p>
                          <p>{format(today, 'y')}</p>
                        </React.Fragment>
                      )}
                      {!isActive && opponent && (
                        <img src={opponent.team.blazon} title={opponent.team.name} />
                      )}
                      {!isActive && !opponent && <FaCloudMoon />}
                    </figure>
                    <aside>
                      <h2>{format(today, 'd')}</h2>
                      <p>
                        {isActive && format(today, 'E')}
                        {!isActive && opponent && 'match'}
                        {!isActive && !opponent && 'rest'}
                      </p>
                    </aside>
                  </article>
                );
              })}
          </section>
          {(() => {
            // placeholder while things are loading
            // or if there are no matches
            if (!spotlight) {
              return (
                <section className="card image-full card-compact h-80 flex-grow rounded-none before:!rounded-none">
                  <figure>
                    <Image
                      className="h-full w-full"
                      src={Util.convertMapPool('de_dust2', Constants.Game.CSGO, true)}
                    />
                  </figure>
                  <article className="card-body items-center justify-center">
                    No Upcoming Match
                  </article>
                </section>
              );
            }

            // the suffix is either the current position
            // or their league tier if it's a cup
            const disabled = state.working || !isMatchday;
            const [home, away] = spotlight.competitors;
            const [homeHistorial, awayHistorial] = matchHistorial;
            const [homeSuffix, awaySuffix] = [home, away].map((competitor) => {
              if (!spotlight.competition.tier.groupSize) {
                return Constants.IdiomaticTier[Constants.Prestige[competitor.team.tier]];
              }

              return Util.toOrdinalSuffix(
                userGroupCompetitors.findIndex((a) => a.teamId === competitor.teamId) + 1,
              );
            });

            return (
              <section className="card image-full card-compact h-80 flex-grow rounded-none before:!rounded-none">
                <figure className="border border-base-content/10">
                  <Image
                    className="h-full w-full"
                    src={Util.convertMapPool(spotlight.games[0].map, settings.general.game, true)}
                  />
                </figure>
                <article className="card-body">
                  <header className="grid h-full grid-cols-3 place-items-center">
                    <aside className="stack-y items-center">
                      <img src={home.team.blazon} className="size-32" />
                      <Historial matches={homeHistorial} teamId={home.teamId} />
                      <div className="text-center">
                        <p>{home.team.name}</p>
                        <p>
                          <small>{homeSuffix}</small>
                        </p>
                      </div>
                    </aside>
                    <aside className="center h-full gap-4">
                      <p>
                        <em>{format(spotlight.date, 'PPPP')}</em>
                      </p>
                      <h3 className="center text-center">
                        <span>{spotlight.competition.tier.league.name}</span>
                        <span>{Constants.IdiomaticTier[spotlight.competition.tier.slug]}</span>
                      </h3>
                      <ul>
                        <li className="stack-x items-center">
                          <FaMapSigns />
                          <span>
                            {Util.convertMapPool(spotlight.games[0].map, settings.general.game)}
                          </span>
                        </li>
                        <li className="stack-x items-center">
                          <FaCalendarDay />
                          <span>
                            {spotlight.competition.tier.groupSize
                              ? `Matchday ${spotlight.round}`
                              : Util.parseCupRounds(spotlight.round, spotlight.totalRounds)}
                          </span>
                        </li>
                      </ul>
                    </aside>
                    <aside className="stack-y items-center">
                      <img src={away.team.blazon} className="size-32" />
                      <Historial matches={awayHistorial} teamId={away.teamId} />
                      <div className="text-center">
                        <p>{away.team.name}</p>
                        <p>
                          <small>{awaySuffix}</small>
                        </p>
                      </div>
                    </aside>
                  </header>
                  <footer className="join justify-center">
                    <button
                      title="Match Setup"
                      className="btn btn-square btn-ghost join-item hover:bg-transparent hover:text-secondary"
                      disabled={
                        disabled || !!appStatusError || state.appStatus?.includes('plugins')
                      }
                      onClick={() =>
                        api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                          target: '/play',
                          payload: spotlight.id,
                        })
                      }
                    >
                      <FaCog />
                    </button>
                    <button
                      className="btn btn-primary join-item btn-wide"
                      disabled={
                        disabled || !!appStatusError || state.appStatus?.includes('plugins')
                      }
                      onClick={() => {
                        setPlaying(true);
                        Util.sleep(GAME_LAUNCH_DELAY)
                          .then(api.play.start)
                          .then(() => startEngineLoop(1))
                          .then(() => setPlaying(false));
                      }}
                    >
                      Play
                    </button>
                    <button
                      className={cx('btn join-item btn-wide', disabled && 'btn-outline')}
                      disabled={disabled}
                      onClick={() => api.calendar.sim().then(() => startEngineLoop(1))}
                    >
                      Sim Match
                    </button>
                  </footer>
                </article>
              </section>
            );
          })()}
          <section className="grid grid-cols-2 divide-x divide-base-content/10">
            {((!!spotlight && spotlight.competitors) || [...Array(2)]).map(
              (competitor, competitorIdx) => {
                const matches = competitor ? matchHistorial[competitorIdx] : [];
                const previousFiller = [...Array(Math.max(0, NUM_PREVIOUS - matches.length))];
                return (
                  <article
                    key={`${competitor?.id}_${competitorIdx}__match_previous`}
                    className="stack-y !gap-0"
                  >
                    <header className="prose !border-t-0">
                      <h4 className="truncate">
                        {competitor?.team?.name ? `${competitor.team.name}'s` : ''} Recent Matches
                      </h4>
                    </header>
                    <table className="table table-fixed">
                      <tbody>
                        {!!matches.length &&
                          matches.slice(0, NUM_PREVIOUS).map((match) => {
                            const opponent = match.competitors.find(
                              (c) => c.teamId !== competitor.teamId,
                            );
                            const result = match.competitors.find(
                              (c) => c.teamId === competitor.teamId,
                            )?.result;
                            const onClick =
                              match._count.events > 0
                                ? () =>
                                    api.window.send<ModalRequest>(
                                      Constants.WindowIdentifier.Modal,
                                      {
                                        target: '/postgame',
                                        payload: match.id,
                                      },
                                    )
                                : null;

                            return (
                              <tr
                                key={`${match.id}__match_previous`}
                                onClick={onClick}
                                className={cx(onClick && 'cursor-pointer hover:bg-base-content/10')}
                              >
                                <td
                                  className={cx('w-1/12', !onClick && 'text-muted')}
                                  title={onClick ? 'View Match Details' : 'No Match Details'}
                                >
                                  <FaChartBar />
                                </td>
                                <td className="w-1/12" title={format(match.date, 'PPPP')}>
                                  {format(match.date, 'MM/dd')}
                                </td>
                                <td
                                  className={cx(
                                    'w-3/12 text-center',
                                    Util.getResultTextColor(result),
                                  )}
                                >
                                  {match.competitors
                                    .map((competitor) => competitor.score)
                                    .join(' : ') || '-'}
                                </td>
                                <td className="w-4/12 truncate" title={opponent?.team.name || '-'}>
                                  {!!opponent?.team && (
                                    <img
                                      className="mr-2 inline-block size-4"
                                      src={
                                        opponent?.team.blazon || 'resources://blazonry/009400.png'
                                      }
                                    />
                                  )}
                                  <span>{opponent?.team.name || 'BYE'}</span>
                                </td>
                                <td
                                  className="w-3/12 truncate"
                                  title={`${match.competition.tier.league.name}: ${Constants.IdiomaticTier[match.competition.tier.slug]}`}
                                >
                                  {Constants.IdiomaticTier[match.competition.tier.slug]}
                                </td>
                              </tr>
                            );
                          })}
                        {previousFiller.map((_, idx) => (
                          <tr key={`${idx}__filler_match_previous`} className="text-muted">
                            <td className="w-1/12">
                              {state.profile
                                ? format(
                                    addDays(
                                      !matches.length
                                        ? state.profile.date
                                        : matches.slice(-1)[0].date,
                                      idx - 1,
                                    ),
                                    'MM/dd',
                                  )
                                : '-'}
                            </td>
                            <td className="w-4/12 text-center">-</td>
                            <td className="w-4/12">No Recent Match</td>
                            <td className="w-3/12">-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </article>
                );
              },
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
