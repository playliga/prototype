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
import { Standings, Image } from '@liga/frontend/components';
import {
  FaCalendarDay,
  FaCloudMoon,
  FaExclamationTriangle,
  FaForward,
  FaMapSigns,
} from 'react-icons/fa';

/** @constant */
const GAME_LAUNCH_DELAY = 1000;

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const { state } = React.useContext(AppStateContext);
  const [working, setWorking] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [settings, setSettings] = React.useState(Constants.Settings);
  const [upcoming, setUpcoming] = React.useState<
    Awaited<ReturnType<typeof api.matches.upcoming<typeof Eagers.match>>>
  >([]);
  const [matches, setMatches] = React.useState<typeof upcoming>([]);

  // load settings
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    setSettings(JSON.parse(state.profile.settings));
  }, [state.profile]);

  // fetch upcoming list of matches
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    api.matches.upcoming(Eagers.match).then(setUpcoming);
  }, [state.profile]);

  // fetch all matches for current round
  React.useEffect(() => {
    const [nextMatch] = upcoming.slice(0, 1);

    if (!nextMatch) {
      return;
    }

    api.matches
      .all({
        where: {
          competitionId: nextMatch.competitionId,
          round: nextMatch.round,
        },
        include: Eagers.match.include,
      })
      .then(setMatches);
  }, [upcoming]);

  // check if its matchday
  const isMatchday = React.useMemo(
    () =>
      state.profile &&
      upcoming.length &&
      upcoming[0]?.date.toISOString() === state.profile.date.toISOString(),
    [upcoming, state.profile],
  );

  // grab next match info
  const [nextMatch] = React.useMemo(() => upcoming.slice(0, 1), [upcoming]);

  // grab user's team info
  const userTeam = React.useMemo(
    () =>
      !!nextMatch &&
      nextMatch.competition.competitors.find(
        (competitor) => competitor.teamId === state.profile.teamId,
      ),
    [nextMatch],
  );

  // grab competitors by user's group
  const userGroupCompetitors = React.useMemo(
    () =>
      !!nextMatch &&
      !!nextMatch.competition.tier.groupSize &&
      nextMatch.competition.competitors
        .filter((competitor) => competitor.group === userTeam.group)
        .sort((a, b) => a.position - b.position),
    [nextMatch, userTeam],
  );

  // start the engine loop
  const startEngineLoop = async (days?: number) => {
    setWorking(true);
    await api.calendar.start(days);
    return setWorking(false);
  };

  // figure out which game is not installed
  const appStatusError = React.useMemo(() => {
    const [, match] = state.appStatus?.match(/(csgo|hl|hl2)\.exe/) || [];
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
      {!!appStatusError && (
        <section className="alert alert-warning flex h-8 justify-center rounded-none p-0">
          <FaExclamationTriangle />
          {!!Constants.GameSettings.CS16_EXE.includes(appStatusError) && (
            <p>
              Counter-Strike 1.6 not detected! Please install in order to play your matches in-game.
            </p>
          )}
          {!!Constants.GameSettings.CSSOURCE_EXE.includes(appStatusError) && (
            <p>
              Counter-Strike Source not detected! Please install in order to play your matches in-game.
            </p>
          )}
          {!!Constants.GameSettings.CSGO_EXE.includes(appStatusError) && (
            <React.Fragment>
              <p>CS:GO not detected! Enable CS:GO Legacy version from the Betas tab.</p>
              <button
                className="btn btn-neutral btn-sm rounded-none"
                onClick={() => {
                  api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                    target: '/kb/' + appStatusError,
                  });
                }}
              >
                Details
              </button>
            </React.Fragment>
          )}
        </section>
      )}

      {/** MAIN CONTENT */}
      <main>
        <div className="stack-y !gap-0">
          <section className="stack-y">
            <header className="prose !border-t-0">
              <h2>Upcoming Matches</h2>
            </header>
            <div className="stack-y divide-y divide-base-content/10">
              {upcoming.slice(1, 4).length === 0 && (
                <article key="empty__match_upcoming" className="card h-32 rounded-none">
                  <aside className="card-body items-center justify-center">
                    <p className="flex-grow-0">No upcoming matches.</p>
                  </aside>
                </article>
              )}
              {upcoming.slice(1, 4).map((match) => {
                const [home, away] = match.competitors;
                return (
                  <article key={`${match.id}__match_upcoming`} className="card rounded-none">
                    <header className="card-title relative justify-center pt-2">
                      <p className="absolute left-2 text-sm font-normal">
                        {format(match.date, Constants.Application.CALENDAR_DATE_FORMAT)}
                      </p>
                      <h2 className="text-base">{match.competition.tier.league.name}</h2>
                    </header>
                    <aside className="card-body flex-row justify-center gap-4">
                      <p
                        className="flex-grow-0 basis-1/3 truncate text-right"
                        title={home?.team.name || 'TBD'}
                      >
                        {home?.team.name || 'TBD'}
                      </p>
                      <img
                        src={`resources://blazonry/${home?.team.blazon || '009400.png'}`}
                        className="size-8"
                      />
                      <p className="flex-grow-0">vs</p>
                      <img
                        src={`resources://blazonry/${away?.team.blazon || '009400.png'}`}
                        className="size-8"
                      />
                      <p
                        className="flex-grow-0 basis-1/3 truncate"
                        title={away?.team.name || 'TBD'}
                      >
                        {away?.team.name || 'TBD'}
                      </p>
                    </aside>
                  </article>
                );
              })}
            </div>
          </section>
          <section className="stack-y">
            <header className="prose">
              <h2>Standings</h2>
            </header>
            {!nextMatch && (
              <article key="empty__standings" className="card h-32 rounded-none">
                <aside className="card-body items-center justify-center">
                  <p className="flex-grow-0">It's quiet... too quiet.</p>
                </aside>
              </article>
            )}
            {!!nextMatch &&
              (() => {
                if (nextMatch.competition.tier.groupSize) {
                  return (
                    <Standings
                      highlight={state.profile.teamId}
                      // offset={userGroupCompetitors.length > 10 && userTeam.position > 10 && 10}
                      // limit={10}
                      competitors={userGroupCompetitors}
                      title={
                        nextMatch.competition.tier.league.slug ===
                        Constants.LeagueSlug.ESPORTS_LEAGUE
                          ? Constants.IdiomaticTier[nextMatch.competition.tier.slug]
                          : `Group ${String.fromCharCode(97 + (userTeam.group - 1)).toUpperCase()}`
                      }
                      zones={
                        nextMatch.competition.started &&
                        (Constants.TierZones[nextMatch.competition.tier.slug] ||
                          Constants.TierZones.default)
                      }
                    />
                  );
                }

                return (
                  <article className="stack-y !gap-8 pb-2">
                    <header className="text-center">
                      <h2>{nextMatch.competition.tier.league.name}</h2>
                      <h3>{Constants.IdiomaticTier[nextMatch.competition.tier.slug]}</h3>
                      <p>{Util.parseCupRound(nextMatch.round, matches.length)}</p>
                    </header>
                    <aside className="grid grid-cols-2 place-items-center">
                      {nextMatch.competitors.map((competitor) => (
                        <img
                          key={`${competitor.id}__cup_splotlight`}
                          title={competitor.team.name}
                          src={`resources://blazonry/${competitor.team.blazon}`}
                          className="size-32"
                        />
                      ))}
                    </aside>
                    <footer className="text-center">
                      <button
                        className="btn"
                        onClick={() => {
                          api.window.send<ModalRequest>(Constants.WindowIdentifier.Modal, {
                            target: '/brackets',
                            payload: nextMatch.competitionId,
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
        <div className="stack-y !gap-0">
          <section className="grid grid-cols-6 divide-x divide-base-content/10">
            <button
              title="Advance Calendar"
              className="day day-btn border-t-0"
              disabled={!state.profile || working || isMatchday}
              onClick={() => !working && !isMatchday && startEngineLoop()}
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
                        <img
                          src={`resources://blazonry/${opponent.team.blazon}`}
                          title={opponent.team.name}
                        />
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
            if (!nextMatch || !matches.length) {
              return (
                <section className="card image-full h-full rounded-none before:!rounded-none">
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
            const disabled = working || !isMatchday;
            const [home, away] = nextMatch.competitors;
            const [homeSuffix, awaySuffix] = [home, away].map((competitor) => {
              if (!nextMatch.competition.tier.groupSize) {
                return Constants.IdiomaticTier[Constants.Prestige[competitor.team.tier]];
              }

              return Util.toOrdinalSuffix(
                userGroupCompetitors.findIndex((a) => a.teamId === competitor.teamId) + 1,
              );
            });

            return (
              <section className="card image-full h-full rounded-none before:!rounded-none">
                <figure className="border border-base-content/10">
                  <Image
                    className="h-full w-full"
                    src={Util.convertMapPool(nextMatch.games[0].map, settings.general.game, true)}
                  />
                </figure>
                <article className="card-body">
                  <h2 className="card-title flex-col items-center">
                    <span>
                      {nextMatch.competition.tier.league.name}:{' '}
                      {Constants.IdiomaticTier[nextMatch.competition.tier.slug]}
                    </span>
                    <small>{format(nextMatch.date, 'PPPP')}</small>
                  </h2>
                  <aside
                    key={`${nextMatch.id}__match`}
                    className="grid h-full grid-cols-3 place-items-center"
                  >
                    <div className="stack-y items-center !gap-0">
                      <img src={`resources://blazonry/${home.team.blazon}`} className="size-32" />
                      <p>{home.team.name}</p>
                      <p>
                        <small>{homeSuffix}</small>
                      </p>
                    </div>
                    <ul>
                      <li className="stack-x items-center">
                        <FaMapSigns />
                        <span>
                          {Util.convertMapPool(nextMatch.games[0].map, settings.general.game)}
                        </span>
                      </li>
                      <li className="stack-x items-center">
                        <FaCalendarDay />
                        <span>
                          {nextMatch.competition.tier.groupSize
                            ? `Matchday ${nextMatch.round}`
                            : Util.parseCupRound(nextMatch.round, matches.length)}
                        </span>
                      </li>
                    </ul>
                    <div className="stack-y items-center !gap-0">
                      <img src={`resources://blazonry/${away.team.blazon}`} className="size-32" />
                      <p>{away.team.name}</p>
                      <p>
                        <small>{awaySuffix}</small>
                      </p>
                    </div>
                  </aside>
                  <aside className="join justify-center">
                    <button
                      className="btn btn-primary join-item btn-wide"
                      disabled={disabled || !!appStatusError}
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
                  </aside>
                </article>
              </section>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
