/**
 * The play modal allows users to customize settings
 * or their squad before starting their match.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { useLocation } from 'react-router-dom';
import { cloneDeep, differenceBy, isNull, merge, pick, set } from 'lodash';
import { Constants, Eagers, Util } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { Image, PlayerCard } from '@liga/frontend/components';
import { FaExclamationTriangle } from 'react-icons/fa';

/** @type {Matches} */
type Matches<T = typeof Eagers.match> = Awaited<ReturnType<typeof api.matches.all<T>>>;

/** @constant */
const LOCAL_STORAGE_KEY = 'settings';

/** @constants */
const SETTINGS_DEFAULT = pick(Constants.Settings, ['matchRules']);

/**
 * Renders an override settings warning.
 *
 * @param props       The root props.
 * @param props.left  The left value to compare.
 * @param props.right The right value to compare.
 * @function
 */
function SettingsOverrideLabel(props: { left: unknown; right: unknown }) {
  if (props.left === props.right) {
    return;
  }

  return (
    <span className="tooltip" data-tip="Overrides the default. Resets after this match ends.">
      <FaExclamationTriangle className="text-warning" />
    </span>
  );
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const location = useLocation();
  const { state } = React.useContext(AppStateContext);
  const [settings, setSettings] = React.useState(SETTINGS_DEFAULT);
  const [match, setMatch] = React.useState<Matches[number]>();
  const [userSquad, setUserSquad] = React.useState<
    Awaited<ReturnType<typeof api.squad.all<typeof Eagers.player>>>
  >([]);

  // we only want to maintain and override specific settings
  // and not copy/merge with the whole object
  const settingsAll = React.useMemo(
    () => !!state.profile && Util.loadSettings(state.profile.settings),
    [],
  );
  const settingsLocal = React.useMemo(
    () =>
      !!localStorage.getItem(LOCAL_STORAGE_KEY) &&
      merge(
        settings,
        JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) as typeof Constants.Settings,
      ),
    [],
  );

  // initial data load
  React.useEffect(() => {
    if (!location.state) {
      return;
    }

    api.squad.all().then(setUserSquad);
    api.matches
      .all({
        where: {
          id: location.state,
        },
        include: Eagers.match.include,
      })
      .then((matches) => setMatch(matches[0]));
  }, []);

  // load settings
  React.useEffect(() => {
    if (settingsLocal) {
      setSettings(settingsLocal);
    } else {
      setSettings(pick(settingsAll, ['matchRules']));
    }
  }, [settingsLocal, settingsAll]);

  // handle settings updates
  const onSettingsUpdate = (path: string, value: unknown) => {
    const modified = cloneDeep(settings);
    set(modified, path, value);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(modified));
    setSettings(modified);
  };

  // grab basic match info
  const game = React.useMemo(() => match && match.games[0], [match]);
  const [home, away] = React.useMemo(() => (match ? match.competitors : []), [match]);

  if (!state.profile || !match) {
    return (
      <main className="h-screen w-screen">
        <section className="center h-full">
          <span className="loading loading-bars" />
        </section>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full flex-col">
      <header className="breadcrumbs sticky top-0 z-30 overflow-x-visible border-b border-base-content/10 bg-base-200 px-2 text-sm">
        <ul>
          <li>
            <span>
              {match.competition.tier.league.name}:&nbsp;
              {Constants.IdiomaticTier[match.competition.tier.slug]}
            </span>
          </li>
          <li>
            {match.competition.tier.groupSize
              ? `Matchday ${match.round}`
              : Util.parseCupRounds(match.round, match.totalRounds)}
          </li>
          <li>{Util.convertMapPool(game.map, settingsAll.general.game)}</li>
        </ul>
      </header>
      <section className="card image-full h-16 rounded-none drop-shadow-md before:!rounded-none">
        <figure>
          <Image
            className="h-full w-full"
            src={Util.convertMapPool(game.map, settingsAll.general.game, true)}
          />
        </figure>
        <header className="card-body grid grid-cols-3 place-items-center p-0">
          <article className="grid w-full grid-cols-2 place-items-center font-black">
            <img src={home.team.blazon} className="size-8" />
            <p>{home.team.name}</p>
          </article>
          <article className="center text-2xl font-bold">
            <p>vs</p>
          </article>
          <article className="grid w-full grid-cols-2 place-items-center font-black">
            <p>{away.team.name}</p>
            <img src={away.team.blazon} className="size-8" />
          </article>
        </header>
      </section>
      <section className="grid grid-cols-2 divide-x divide-base-content/10">
        {match.competitors.map((competitor) => {
          const isUserTeam = competitor.teamId === state.profile.teamId;
          const team = competitor.team;

          // wire user's squad which can be changed
          // on-the-fly to this competitor's squad
          if (isUserTeam) {
            team.players = team.players.map((player) => ({
              ...player,
              starter: userSquad.find((userPlayer) => userPlayer.id === player.id)?.starter,
            }));
          }

          const starters = Util.getSquad(team, state.profile, true);
          const bench = differenceBy(team.players, starters, 'id');
          const squad = { starters, bench };

          return (
            <table key={competitor.id + '__competitor'} className="table table-xs table-fixed">
              {Object.keys(squad).map((key) => (
                <React.Fragment key={key}>
                  <thead>
                    <tr className="border-t border-t-base-content/10">
                      <th>{key.toUpperCase()}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {squad[key as keyof typeof squad].map((player) => (
                      <tr key={player.id + '__squad'}>
                        <td
                          title={player.id === state.profile.playerId ? 'This is you.' : undefined}
                          className={cx(
                            'p-0',
                            player.id === state.profile.playerId && 'bg-base-200/50',
                          )}
                        >
                          <PlayerCard
                            collapsed
                            compact
                            key={player.id + '__squad'}
                            className="border-transparent bg-transparent"
                            game={settingsAll.general.game}
                            player={player}
                            noStats={player.id === state.profile.playerId}
                            onClickStarter={
                              isUserTeam &&
                              player.id !== state.profile.playerId &&
                              (userSquad.filter((userPlayer) => userPlayer.starter).length <
                                Constants.Application.SQUAD_MIN_LENGTH - 1 ||
                                player.starter) &&
                              (() => {
                                api.squad
                                  .update({
                                    where: { id: player.id },
                                    data: {
                                      starter: !player.starter,
                                    },
                                  })
                                  .then(setUserSquad);
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                    {squad[key as keyof typeof squad].length === 0 && (
                      <tr>
                        <td className="h-[70px] text-center">
                          <b>{team.name}</b> has nobody on the bench.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </React.Fragment>
              ))}
            </table>
          );
        })}
      </section>
      <form className="form-ios">
        <fieldset>
          <legend className="!border-t-0">Match Rules</legend>
          <article>
            <header>
              <h3>Max Rounds</h3>
              <SettingsOverrideLabel
                left={Number(settings.matchRules.maxRounds)}
                right={Number(settingsAll.matchRules.maxRounds)}
              />
            </header>
            <aside>
              <select
                className="select w-full"
                onChange={(event) => onSettingsUpdate('matchRules.maxRounds', event.target.value)}
                value={settings.matchRules.maxRounds}
              >
                {[6, 12, 24, 30].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </aside>
          </article>
          <article>
            <header>
              <h3>Freeze Time</h3>
              <SettingsOverrideLabel
                left={Number(settings.matchRules.freezeTime)}
                right={Number(settingsAll.matchRules.freezeTime)}
              />
            </header>
            <aside>
              <select
                className="select w-full"
                onChange={(event) => onSettingsUpdate('matchRules.freezeTime', event.target.value)}
                value={settings.matchRules.freezeTime}
              >
                {[7, 15].map((value) => (
                  <option key={value} value={value}>
                    {value}s
                  </option>
                ))}
              </select>
            </aside>
          </article>
          <article>
            <header>
              <h3>Map Override</h3>
              <SettingsOverrideLabel
                left={Number(settings.matchRules.mapOverride)}
                right={Number(settingsAll.matchRules.mapOverride)}
              />
            </header>
            <aside>
              <select
                className="select w-full"
                onChange={(event) =>
                  onSettingsUpdate(
                    'matchRules.mapOverride',
                    event.target.value === 'none' ? null : event.target.value,
                  )
                }
                value={
                  isNull(settings.matchRules.mapOverride) ? '' : settings.matchRules.mapOverride
                }
              >
                <option value={null}>none</option>
                {Constants.MapPool.map((map) => (
                  <option key={map} value={map}>
                    {map}
                  </option>
                ))}
              </select>
            </aside>
          </article>
        </fieldset>
      </form>
    </main>
  );
}
