/**
 * Postgame modal.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { intersectionBy } from 'lodash';
import { useLocation } from 'react-router-dom';
import { Constants, Eagers, Util } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { Image } from '@liga/frontend/components';
import { FaBomb, FaSkull, FaTools } from 'react-icons/fa';

/** @type {Matches} */
type Matches<T = typeof Eagers.match> = Awaited<ReturnType<typeof api.matches.all<T>>>;

/** @interface */
interface ScoreboardProps {
  competitor: Matches<typeof Eagers.matchEvents>[number]['competitors'][number];
  match: Matches<typeof Eagers.matchEvents>[number];
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
  return { events, assists, kills, deaths, hsp, kd };
}

/**
 * @param result  The round result.
 * @param side    The side.
 * @param half    The half.
 */
function getRoundWinIcon(result: string, side: number, half: number) {
  if ((side === 0 && half === 0) || (side === 1 && half === 1)) {
    switch (result) {
      case 'SFUI_Notice_Terrorists_Win':
      case 'Terrorists_Win':
        return <FaSkull className="text-error" />;
      case 'SFUI_Notice_Target_Bombed':
      case 'Target_Bombed':
        return <FaBomb className="text-error" />;
      default:
        return null;
    }
  }
  switch (result) {
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
  const players = React.useMemo(
    () => intersectionBy(props.competitor.team.players, props.match.players, 'name'),
    [props.competitor.team.players, props.match.players],
  );
  const killOrAssistEvents = React.useMemo(
    () => props.match.events.filter((event) => event.weapon !== null || event.assistId),
    [props.match],
  );

  return (
    <table className="table table-xs">
      <thead>
        <tr className="border-t border-t-base-content/10">
          <th>
            <p title={props.competitor.team.name}>
              {!!props.competitor.team.blazon && (
                <img src={props.competitor.team.blazon} className="mr-2 inline-block size-4" />
              )}
              {props.competitor.team.name}
            </p>
          </th>
          <th title="Kills" className="w-[10%] text-center">
            K
          </th>
          <th title="Deaths" className="w-[10%] text-center">
            D
          </th>
          <th title="Assists" className="w-[10%] text-center">
            A
          </th>
          <th title="Headshot Percentage" className="w-[10%] text-center">
            HS %
          </th>
          <th title="Kills and Deaths Difference" className="w-[10%] text-center">
            +/-
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
  const { state } = React.useContext(AppStateContext);
  const [settings, setSettings] = React.useState(Constants.Settings);
  const [match, setMatch] = React.useState<Matches<typeof Eagers.matchEvents>[number]>();

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
      <header className="breadcrumbs sticky top-0 z-30 border-b border-base-content/10 bg-base-200 px-2 text-sm">
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
          <li>{Util.convertMapPool(game.map, settings.general.game)}</li>
        </ul>
      </header>
      <section className="card image-full h-16 rounded-none before:!rounded-none">
        <figure>
          <Image
            className="h-full w-full"
            src={Util.convertMapPool(game.map, settings.general.game, true)}
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
                home.score > away.score
                  ? 'text-success'
                  : home.score < away.score
                    ? 'text-error'
                    : 'text-inherit'
              }
            >
              {home.score}
            </p>
            <p>:</p>
            <p
              className={
                away.score > home.score
                  ? 'text-success'
                  : away.score < home.score
                    ? 'text-error'
                    : 'text-inherit'
              }
            >
              {away.score}
            </p>
          </article>
          <article className="grid w-full grid-cols-2 place-items-center font-black">
            <p>{away.team.name}</p>
            <img src={away.team.blazon} className="size-8" />
          </article>
        </header>
      </section>
      <Scoreboard match={match} competitor={home} />
      <table className="table table-xs">
        <thead>
          <tr className="border-t border-t-base-content/10">
            <th colSpan={3}>Timeline</th>
          </tr>
        </thead>
        <tbody>
          {match.competitors.map((competitor, idx) => {
            const roundEndEvents = match.events.filter((event) => event.winnerId !== null);
            return (
              <tr key={competitor.team.name + '__round_history'}>
                <td className="w-[10%] text-center">
                  <img src={competitor.team.blazon} className="inline-block size-4" />
                </td>
                {[...Array(2)].map((_, half) => (
                  <td
                    key={competitor.team.name + half + '__round_item'}
                    className="w-[45%] border-l border-base-content/10"
                  >
                    <section className="flex justify-between">
                      {roundEndEvents
                        .filter((event) => event.half === half)
                        .map((event, round) => (
                          <article
                            key={competitor.team.name + event.id}
                            title={'Round ' + (round + 1)}
                            className="center basis-4"
                          >
                            {event.winnerId === competitor.id ? (
                              getRoundWinIcon(event.result, idx, event.half)
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
      <Scoreboard match={match} competitor={away} />
      <section className="h-0 flex-grow overflow-x-auto">
        <table className="table table-pin-rows table-xs">
          {[...Array(2)].map((_, half) => (
            <React.Fragment key={half + '__match_log'}>
              <thead>
                <tr className="border-t border-t-base-content/10">
                  <th>Match Log - {Util.toOrdinalSuffix(half + 1)} Half</th>
                </tr>
              </thead>
              <tbody>
                {match.events
                  .filter((event) => event.half === half)
                  .map((event) => {
                    const payload = JSON.parse(event.payload);
                    const action = event?.attacker ? 'killed' : 'assisted killing';
                    return (
                      <tr
                        key={event.id + '__match_log'}
                        className={cx(event.winnerId && 'font-bold')}
                      >
                        <td>
                          {event.winnerId ? (
                            <span>
                              {event.winner.team.name} won the round.&nbsp;
                              {JSON.stringify(payload.payload.score)}
                            </span>
                          ) : (
                            <span>
                              {event.attacker?.name || event.assist?.name}&nbsp;
                              {action}&nbsp;
                              {event.victim.name}&nbsp;
                              {!!event.weapon && <span>with {event.weapon}&nbsp;</span>}
                              {!!event.headshot && <span>(headshot)</span>}
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
      </section>
    </main>
  );
}
