/**
 * Renders the layout for the teams route.
 *
 * @module
 */
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Constants, Eagers, Util } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { findTeamOptionByValue, TeamSelect } from '@liga/frontend/components/select';

/** @enum */
enum TabIdentifier {
  OVERVIEW = '/teams',
  HISTORY = '/teams/history',
  RESULTS = '/teams/results',
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const [federations, setFederations] = React.useState<
    Awaited<ReturnType<typeof api.federations.all>>
  >([]);
  const [selectedFederationId, setSelectedFederationId] = React.useState<number>();
  const [selectedTeam, setSelectedTeam] =
    React.useState<ReturnType<typeof findTeamOptionByValue>>();
  const [selectedTierId, setSelectedTierId] = React.useState<number>();
  const [teams, setTeams] = React.useState<
    Awaited<ReturnType<typeof api.teams.all<typeof Eagers.team>>>
  >([]);
  const [team, setTeam] = React.useState<(typeof teams)[number]>();

  // build team query
  const teamQuery = React.useMemo(
    () => ({
      ...Eagers.team,
      ...Util.buildTeamQuery(selectedFederationId, null, selectedTierId),
    }),
    [selectedFederationId, selectedTierId],
  );

  // initial data fetch
  React.useEffect(() => {
    api.federations.all().then(setFederations);
    api.teams.all<typeof Eagers.team>(Eagers.team).then(setTeams);
  }, []);

  // preload the user's team
  React.useEffect(() => {
    if (!state.profile || !teams.length || team) {
      return;
    }

    setTeam(teams.find((tteam) => tteam.id === state.profile.teamId));
  }, [state.profile, teams, team]);

  // apply team filters
  React.useEffect(() => {
    api.teams.all<typeof Eagers.team>(teamQuery).then(setTeams);
  }, [teamQuery]);

  // massage team data to team selector data structure
  const teamSelectorData = React.useMemo(
    () =>
      Constants.Prestige.filter((_, prestigeIdx) =>
        Number.isInteger(selectedTierId) ? prestigeIdx === selectedTierId : true,
      ).map((prestige) => ({
        label: Constants.IdiomaticTier[prestige],
        options: teams
          .filter((team) => team.tier === Constants.Prestige.findIndex((tier) => tier === prestige))
          .map((team) => ({
            ...team,
            value: team.id,
            label: team.name,
          })),
      })),
    [teams, selectedTierId],
  );

  return (
    <div className="dashboard">
      <header>
        <button
          className={cx(location.pathname === TabIdentifier.OVERVIEW && 'btn-active!')}
          onClick={() => navigate(TabIdentifier.OVERVIEW)}
        >
          {t('shared.overview')}
        </button>
        <button
          className={cx(location.pathname === TabIdentifier.HISTORY && 'btn-active!')}
          onClick={() => navigate(TabIdentifier.HISTORY)}
        >
          {t('main.teams.history')}
        </button>
        <button
          className={cx(location.pathname === TabIdentifier.RESULTS && 'btn-active!')}
          onClick={() => navigate(TabIdentifier.RESULTS)}
        >
          {t('shared.results')}
        </button>
      </header>
      <main>
        <form className="form-ios form-ios-col-2">
          <fieldset>
            <legend className="border-t-0!">{t('shared.filters')}</legend>
            <section>
              <header>
                <p>{t('shared.federation')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => setSelectedFederationId(Number(event.target.value))}
                  value={selectedFederationId}
                >
                  <option value="">{t('shared.any')}</option>
                  {federations
                    .filter(
                      (federation) => federation.slug !== Constants.FederationSlug.ESPORTS_WORLD,
                    )
                    .map((federation) => (
                      <option key={federation.id} value={federation.id}>
                        {federation.name}
                      </option>
                    ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.tierPrestige')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => setSelectedTierId(Number(event.target.value))}
                  value={selectedTierId}
                >
                  <option value="">{t('shared.any')}</option>
                  {Constants.Prestige.map((prestige, prestigeId) => (
                    <option key={prestige} value={prestigeId}>
                      {Constants.IdiomaticTier[prestige]}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.team')}</p>
              </header>
              <article>
                <TeamSelect
                  className="w-full"
                  backgroundColor="var(--color-base-200)"
                  options={teamSelectorData}
                  value={selectedTeam}
                  onChange={(option) =>
                    setSelectedTeam(findTeamOptionByValue(teamSelectorData, option.value))
                  }
                />
              </article>
            </section>
          </fieldset>
          <fieldset>
            <section>
              <button
                type="button"
                className="btn btn-primary btn-block col-span-2!"
                disabled={selectedFederationId < 0 || selectedTierId < 0 || !selectedTeam}
                onClick={() => setTeam(teams.find((tteam) => tteam.id === selectedTeam.id))}
              >
                {t('shared.apply')}
              </button>
            </section>
          </fieldset>
        </form>
        {!team && (
          <section className="center h-full">
            <span className="loading loading-bars" />
          </section>
        )}
        {!!team && <Outlet context={{ team } satisfies RouteContextTeams} />}
      </main>
    </div>
  );
}
