/**
 * Postgame modal.
 *
 * @module
 */
import React from 'react';
import { intersectionBy } from 'lodash';
import { useLocation } from 'react-router-dom';
import { Constants, Eagers, Util } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { Image } from '@liga/frontend/components';
import { FaBomb, FaSkull, FaTools } from 'react-icons/fa';

/** @type {Matches} */
type Matches<T = typeof Eagers.match> = Awaited<ReturnType<typeof api.matches.all<T>>>;

/** @type {MatchGame} */
type MatchGame = Matches[number]['games'][number];

/** @interface */
interface ScoreboardProps {
  competitor: Matches<typeof Eagers.matchEvents>[number]['competitors'][number];
  match: Matches<typeof Eagers.matchEvents>[number];
  matchGame?: MatchGame;
}

/** @enum */
enum Rating {
  LOW = 0.95,
  HIGH = 1.1,
}

/**
 * Computed a simple HLTV-style rating using only k/d ratio.
 *
 * @param kills   Number of kills.
 * @param deaths  Number of deaths.
 * @function
 */
function getPlayerRating(kills: number, deaths: number) {
  // give a small k/d boost
  const boost = 0.05;
  const raw = (kills + 1) / (deaths + 1) + boost * (kills - deaths);

  // now scale to common or average hltv
  // ratings you'd see in actual games
  const scale = 0.5;
  const offset = 0.401;
  return scale * raw + offset;
}

/**
 * Generates a player's match performance from the
 * provided player killed or assists events array.
 *
 * @param player  The player to generate stats for.
 * @param events  The player killed events object.
 * @function
 */
function getPlayerPerformance(
  player: ScoreboardProps['competitor']['team']['players'][number],
  events: ScoreboardProps['match']['events'],
) {
  const kills = events.filter((event) => event.attackerId === player.id);
  const headshots = kills.filter((kills) => kills.headshot);
  const assists = events.filter((event) => event.assistId === player.id);
  const deaths = events.filter((event) => event.victimId === player.id && !event.assistId);
  const hsp = headshots.length / (kills.length || 1);
  const kd = kills.length - deaths.length;
  const rating = getPlayerRating(kills.length, deaths.length);
  return { events, assists, kills, deaths, hsp, kd, rating };
}

/**
 * @param result  The round result.
 */
function getRoundWinIcon(result: string) {
  switch (result) {
    case 'SFUI_Notice_Terrorists_Win':
    case 'Terrorists_Win':
      return <FaSkull className="text-error" />;
    case 'SFUI_Notice_Target_Bombed':
    case 'Target_Bombed':
      return <FaBomb className="text-error" />;
    case 'SFUI_Notice_CTs_Win':
    case 'CTs_Win':
      return <FaSkull className="text-info" />;
    case 'SFUI_Notice_Bomb_Defused':
    case 'Bomb_Defused':
    case 'SFUI_Target_Saved':
    case 'Target_Saved':
      return <FaTools className="text-info" />;
    default:
      return null;
  }
}

/**
 * @param props Root props.
 */
function Scoreboard(props: ScoreboardProps) {
  const t = useTranslation('windows');
  const players = React.useMemo(
    () => intersectionBy(props.competitor.team.players, props.match.players, 'name'),
    [props.competitor.team.players, props.match.players],
  );
  const matchEvents = React.useMemo(
    () =>
      props.matchGame
        ? props.match.events.filter((matchEvent) => matchEvent.gameId === props.matchGame.id)
        : props.match.events,
    [props.match, props.matchGame],
  );
  const killOrAssistEvents = React.useMemo(
    () => matchEvents.filter((event) => event.weapon !== null || event.assistId),
    [matchEvents],
  );

  return (
    <table className="table-xs table">
      <thead>
        <tr className="border-t-base-content/10 border-t">
          <th>
            <p title={props.competitor.team.name}>
              {!!props.competitor.team.blazon && (
                <img src={props.competitor.team.blazon} className="mr-2 inline-block size-4" />
              )}
              {props.competitor.team.name}
            </p>
          </th>
          <th title="Rating" className="w-[10%] text-center">
            {t('postgame.rating')}
          </th>
          <th title={t('postgame.kills')} className="w-[10%] text-center">
            {t('postgame.killsAlt')}
          </th>
          <th title={t('postgame.deaths')} className="w-[10%] text-center">
            {t('postgame.deathsAlt')}
          </th>
          <th title={t('postgame.assists')} className="w-[10%] text-center">
            {t('postgame.assistsAlt')}
          </th>
          <th title={t('postgame.headshots')} className="w-[10%] text-center">
            {t('postgame.headshotsAlt')}
          </th>
          <th title={t('postgame.kd')} className="w-[10%] text-center">
            {t('postgame.kdAlt')}
          </th>
        </tr>
      </thead>
      <tbody>
        {players
          .sort(
            (playerA, playerB) =>
              getPlayerPerformance(playerB, killOrAssistEvents).kd -
              getPlayerPerformance(playerA, killOrAssistEvents).kd,
          )
          .map((player) => {
            const report = getPlayerPerformance(player, killOrAssistEvents);
            return (
              <tr key={player.name + '__scoreboard'}>
                <td>
                  <span className={cx('fp', 'mr-2', player.country.code.toLowerCase())} />
                  <span>{player.name}</span>
                </td>
                <td
                  className={cx(
                    'text-center',
                    report.rating <= Rating.LOW && 'text-error',
                    report.rating > Rating.LOW && report.rating < Rating.HIGH && 'text-inherit',
                    report.rating >= Rating.HIGH && 'text-success',
                  )}
                >
                  {new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(report.rating)}
                </td>
                <td className="text-center">{report.kills.length}</td>
                <td className="text-center">{report.deaths.length}</td>
                <td className="text-center">{report.assists.length}</td>
                <td className="text-center">
                  {new Intl.NumberFormat('en-US', {
                    style: 'percent',
                  }).format(report.hsp)}
                </td>
                <td
                  className={cx(
                    'text-center',
                    report.kd > 0 ? 'text-success' : 'text-error',
                    report.kd === 0 && 'text-inherit',
                  )}
                >
                  {new Intl.NumberFormat('en-US', { signDisplay: 'exceptZero' }).format(report.kd)}
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const location = useLocation();
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const [match, setMatch] = React.useState<Matches<typeof Eagers.matchEvents>[number]>();
  const [matchGame, setMatchGame] = React.useState<MatchGame>();
  const [settings, setSettings] = React.useState(Constants.Settings);

  // grab match data
  React.useEffect(() => {
    if (!location.state) {
      return;
    }

    api.matches
      .all<typeof Eagers.matchEvents>({
        where: {
          id: location.state,
        },
        include: Eagers.matchEvents.include,
      })
      .then((matches) => setMatch(matches[0]));
  }, []);

  // load settings
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    setSettings(Util.loadSettings(state.profile.settings));
  }, [state.profile]);

  // grab basic match info
  const [home, away] = React.useMemo(() => (match ? match.competitors : []), [match]);
  const [matchGameHome, matchGameAway] = React.useMemo(
    () => (matchGame ? matchGame.teams : match ? match.competitors : []),
    [match, matchGame],
  );
  const matchEvents = React.useMemo(
    () =>
      matchGame
        ? match.events.filter((matchEvent) => matchEvent.gameId === matchGame.id)
        : match
          ? match.events
          : [],
    [match, matchGame],
  );
  const totalHalves = React.useMemo(
    () => Math.max(...matchEvents.map((me) => me.half)) + 1,
    [matchEvents],
  );

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
      <header className="breadcrumbs border-base-content/10 bg-base-200 sticky top-0 z-30 border-b px-2 text-sm">
        <ul>
          <li>
            <span>
              {match.competition.tier.league.name}:&nbsp;
              {Constants.IdiomaticTier[match.competition.tier.slug]}
            </span>
          </li>
          <li>
            {match.competition.tier.groupSize
              ? `${t('shared.matchday')} ${match.round}`
              : Util.parseCupRounds(match.round, match.totalRounds)}
          </li>
          <li>
            {matchGame
              ? Util.convertMapPool(matchGame.map, settings.general.game)
              : t('shared.overview')}
          </li>
        </ul>
      </header>
      <section className="card image-full h-16 rounded-none before:rounded-none!">
        <figure>
          <Image
            className="h-full w-full"
            src={Util.convertMapPool(
              matchGame?.map || match.games[0].map,
              settings.general.game,
              true,
            )}
          />
        </figure>
        <header className="card-body grid grid-cols-3 place-items-center p-0">
          <article className="grid w-full grid-cols-2 place-items-center font-black">
            <img src={home.team.blazon} className="size-8" />
            <p>{home.team.name}</p>
          </article>
          <article className="grid grid-cols-3 place-items-center text-4xl font-bold">
            <p
              className={
                matchGameHome.score > matchGameAway.score
                  ? 'text-success'
                  : matchGameHome.score < matchGameAway.score
                    ? 'text-error'
                    : 'text-inherit'
              }
            >
              {matchGameHome.score}
            </p>
            <p>:</p>
            <p
              className={
                matchGameAway.score > matchGameHome.score
                  ? 'text-success'
                  : matchGameAway.score < matchGameHome.score
                    ? 'text-error'
                    : 'text-inherit'
              }
            >
              {matchGameAway.score}
            </p>
          </article>
          <article className="grid w-full grid-cols-2 place-items-center font-black">
            <p>{away.team.name}</p>
            <img src={away.team.blazon} className="size-8" />
          </article>
        </header>
      </section>
      {match.games.length > 1 && (
        <section
          role="tablist"
          className="tabs-box tabs border-base-content/10 tabs-xs rounded-none border-t"
        >
          <a
            role="tab"
            className={cx('tab', !matchGame && 'tab-active')}
            onClick={() => setMatchGame(null)}
          >
            {t('shared.overview')}
          </a>
          {match.games.map((game) => (
            <a
              role="tab"
              key={'game_' + game.num + '__tab'}
              className={cx(
                'tab',
                game.num === matchGame?.num && 'tab-active',
                game.status !== Constants.MatchStatus.COMPLETED && 'tab-disabled',
              )}
              onClick={() => setMatchGame(game)}
            >
              {Util.convertMapPool(game.map, settings.general.game)}
            </a>
          ))}
        </section>
      )}
      <Scoreboard competitor={home} match={match} matchGame={matchGame} />
      {(match.games.length === 1 || !!matchGame) && (
        <table className="table-xs table">
          <thead>
            <tr className="border-t-base-content/10 border-t">
              <th colSpan={totalHalves + 1}>{t('postgame.timeline')}</th>
            </tr>
          </thead>
          <tbody>
            {match.competitors.map((competitor) => {
              const roundEndEvents = matchEvents.filter((event) => event.winnerId !== null);
              return (
                <tr key={competitor.team.name + '__round_history'}>
                  <td className="w-[10%] text-center">
                    <img src={competitor.team.blazon} className="inline-block size-4" />
                  </td>
                  {[...Array(totalHalves)].map((_, half) => (
                    <td
                      key={competitor.team.name + half + '__round_item'}
                      className={cx('border-base-content/10 border-l', `w-[${90 / totalHalves}%]`)}
                    >
                      <section className="flex justify-between">
                        {roundEndEvents
                          .filter((event) => event.half === half)
                          .map((event, round) => (
                            <article
                              key={competitor.team.name + event.id}
                              title={t('postgame.round') + ' ' + (round + 1)}
                              className="center basis-4"
                            >
                              {event.winnerId === competitor.id ? (
                                getRoundWinIcon(event.result)
                              ) : (
                                <span>&nbsp;</span>
                              )}
                            </article>
                          ))}
                      </section>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <Scoreboard competitor={away} match={match} matchGame={matchGame} />
      <section className="h-0 flex-grow overflow-x-auto">
        {(match.games.length === 1 || !!matchGame) && (
          <table className="table-pin-rows table-xs table">
            {[...Array(totalHalves)].map((_, half) => (
              <React.Fragment key={half + '__match_log'}>
                <thead>
                  <tr className="border-t-base-content/10 border-t">
                    <th>
                      {t('postgame.matchLog')} - {Util.toOrdinalSuffix(half + 1)}{' '}
                      {t('postgame.half')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matchEvents
                    .filter((event) => event.half === half || (half === 0 && event.half === -1))
                    .map((event) => {
                      const payload = JSON.parse(event.payload);
                      const action = event?.attacker
                        ? t('postgame.killed')
                        : t('postgame.assisted');
                      return (
                        <tr
                          key={event.id + '__match_log'}
                          className={cx(event.winnerId && 'font-bold')}
                        >
                          <td>
                            {event.winnerId ? (
                              <span>
                                {event.winner.team.name} {t('postgame.wonRound')}&nbsp;
                                {JSON.stringify(payload.payload.score)}
                              </span>
                            ) : (
                              <span>
                                {event.attacker?.name || event.assist?.name}&nbsp;
                                {action}&nbsp;
                                {event.victim.name}&nbsp;
                                {!!event.weapon && (
                                  <span>
                                    {t('postgame.with')} {event.weapon}&nbsp;
                                  </span>
                                )}
                                {!!event.headshot && <span>({t('postgame.headshot')})</span>}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </React.Fragment>
            ))}
          </table>
        )}
      </section>
      {match.status !== Constants.MatchStatus.COMPLETED && (
        <button
          className="btn btn-xl btn-block btn-secondary rounded-none active:translate-0!"
          onClick={() => {
            api.window.send(Constants.WindowIdentifier.Main, match.id, null);
            api.window.close(Constants.WindowIdentifier.Modal);
          }}
        >
          {t('main.dashboard.play')}
        </button>
      )}
    </main>
  );
}
