/**
 * Competition overview route.
 *
 * @module
 */
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Constants, Eagers, Util } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { Historial, PlayerCard, Standings } from '@liga/frontend/components';
import { FaChartBar } from 'react-icons/fa';
import { addDays, format } from 'date-fns';

/** @constant */
const NUM_PREVIOUS = 5;

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const { team } = useOutletContext<RouteContextTeams>();
  const [competition, setCompetition] =
    React.useState<Awaited<ReturnType<typeof api.competitions.find<typeof Eagers.competition>>>>();
  const [matches, setMatches] = React.useState<
    Awaited<ReturnType<typeof api.matches.upcoming<typeof Eagers.match>>>
  >([]);
  const [settings, setSettings] = React.useState(Constants.Settings);
  const [squad, setSquad] = React.useState<
    Awaited<ReturnType<typeof api.players.all<typeof Eagers.player>>>
  >([]);

  // fetch data when team changes
  React.useEffect(() => {
    api.matches.previous(Eagers.match, team.id, NUM_PREVIOUS).then(setMatches);
    api.competitions
      .find({
        ...Eagers.competition,
        where: {
          tier: {
            slug: Constants.Prestige[team.tier],
          },
          competitors: {
            some: {
              teamId: team.id,
            },
          },
        },
        orderBy: {
          season: 'desc',
        },
      })
      .then(setCompetition);
    api.players
      .all({
        ...Eagers.player,
        where: {
          teamId: team.id,
        },
      })
      .then(setSquad);
  }, [team]);

  // load settings
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    setSettings(Util.loadSettings(state.profile.settings));
  }, [state.profile]);

  // grab user's team info
  const userTeam = React.useMemo(
    () =>
      !!competition && competition.competitors.find((competitor) => competitor.teamId === team.id),
    [competition, team],
  );

  // grab group to highlight
  const group = React.useMemo(
    () =>
      !!competition &&
      competition.competitors.filter((competitor) => competitor.group === (userTeam?.group || 1)),
    [competition, userTeam],
  );

  // filler for previous matches
  const previousFiller = React.useMemo(
    () => [...Array(Math.max(0, NUM_PREVIOUS - matches.length))],
    [matches.length],
  );

  if (!competition) {
    return (
      <section className="center h-full">
        <span className="loading loading-bars" />
      </section>
    );
  }

  return (
    <section className="divide-base-content/10 grid grid-cols-2 divide-x">
      <article>
        <header className="heading prose max-w-none border-t-0!">
          <h2>{t('shared.overview')}</h2>
        </header>
        <aside className="divide-base-content/10 flex divide-x">
          <figure className="center w-1/2 place-content-evenly!">
            <img alt={team.name} src={team.blazon} />
            <Historial matches={matches} teamId={team.id} />
          </figure>
          <table className="table table-fixed">
            <thead>
              <tr>
                <th>{t('shared.name')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{team.name}</td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th>{t('shared.country')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className={cx('fp', team.country.code.toLowerCase())} />
                  &nbsp;{team.country.name}
                </td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th>{t('main.teams.division')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {!!group.length && (
                    <span>{Util.toOrdinalSuffix(userTeam?.position)} in&nbsp;</span>
                  )}
                  {Constants.IdiomaticTier[competition.tier.slug]}
                </td>
              </tr>
            </tbody>
          </table>
        </aside>
        <aside>
          <header className="heading prose max-w-none border-t-0!">
            <h2>{t('shared.squad')}</h2>
          </header>
          <table className="table-xs table table-fixed">
            <tbody>
              {squad.map((player) => (
                <tr key={player.id + '__squad'}>
                  <td
                    title={player.id === state.profile.playerId ? t('shared.you') : undefined}
                    className={cx('p-0', player.id === state.profile.playerId && 'bg-base-200/50')}
                  >
                    <PlayerCard
                      compact
                      key={player.id + '__squad'}
                      className="border-transparent bg-transparent"
                      game={settings.general.game}
                      player={player}
                      noStats={player.id === state.profile.playerId}
                    />
                  </td>
                </tr>
              ))}
              {squad.length === 0 && (
                <tr>
                  <td className="h-[70px] text-center">
                    <b>{team.name}</b> {t('shared.noBench')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </aside>
        <aside>
          <header className="heading prose max-w-none border-t-0!">
            <h2>{t('shared.noRecentMatch')}</h2>
          </header>
          <table className="table table-fixed">
            <tbody>
              {!!matches.length &&
                matches.slice(0, NUM_PREVIOUS).map((match) => {
                  const opponent = match.competitors.find((c) => c.teamId !== team.id);
                  const result = match.competitors.find((c) => c.teamId === team.id)?.result;
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
                      key={`${match.id}__match_previous`}
                      onClick={onClick}
                      className={cx(onClick && 'hover:bg-base-content/10 cursor-pointer')}
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
                      <td className={cx('w-3/12 text-center', Util.getResultTextColor(result))}>
                        {match.competitors.map((competitor) => competitor.score).join(' : ') || '-'}
                      </td>
                      <td className="w-4/12 truncate" title={opponent?.team.name || '-'}>
                        {!!opponent?.team && (
                          <img
                            src={opponent?.team.blazon || 'resources://blazonry/009400.png'}
                            className="mr-2 inline-block size-4"
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
                            !matches.length ? state.profile.date : matches.slice(-1)[0].date,
                            idx - 1,
                          ),
                          'MM/dd',
                        )
                      : '-'}
                  </td>
                  <td className="w-4/12 text-center">-</td>
                  <td className="w-4/12">{t('shared.noRecentMatch')}</td>
                  <td className="w-3/12">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </article>
      <article>
        <header className="heading prose max-w-none border-t-0!">
          <h2>{t('shared.standings')}</h2>
        </header>
        <select
          disabled
          className={cx(
            'select border-base-content/10 w-full rounded-none border-0 border-b',
            'disabled:bg-base-200 disabled:text-opacity-100',
          )}
          value={group.length ? Constants.IdiomaticTier[competition.tier.slug] : -1}
        >
          {!group.length && (
            <option disabled value={-1}>
              {t('shared.competitionNotStarted')}
            </option>
          )}
          {!!group.length && (
            <option disabled value={Constants.IdiomaticTier[competition.tier.slug]}>
              {Constants.IdiomaticTier[competition.tier.slug]}
            </option>
          )}
        </select>
        <Standings
          competitors={group}
          highlight={team.id}
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
