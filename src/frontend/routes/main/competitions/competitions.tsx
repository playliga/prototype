/**
 * Renders the layout for the competitions route.
 *
 * @module
 */
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Constants, Eagers } from '@liga/shared';
import { cx } from '@liga/frontend/lib';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';

/** @enum */
enum TabIdentifier {
  OVERVIEW = '/competitions',
  STANDINGS = '/competitions/standings',
  RESULTS = '/competitions/results',
}

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const [competition, setCompetition] =
    React.useState<Awaited<ReturnType<typeof api.competitions.find<typeof Eagers.competition>>>>();
  const [federations, setFederations] = React.useState<
    Awaited<ReturnType<typeof api.federations.all>>
  >([]);
  const [selectedFederationId, setSelectedFederationId] = React.useState<number>(-1);
  const [selectedSeasonId, setSelectedSeasonId] = React.useState<number>(-1);
  const [selectedTierId, setSelectedTierId] = React.useState<number>(-1);
  const [tiers, setTiers] = React.useState<
    Awaited<ReturnType<typeof api.tiers.all<typeof Eagers.tier>>>
  >([]);

  // build user's continent to fetch their
  // domestic league information later on
  const userContinent = React.useMemo(
    () =>
      !!state.profile &&
      state.continents.find((continent) =>
        continent.countries.some((country) => country.id === state.profile.team.countryId),
      ),
    [state.profile],
  );

  // build queries
  const tierQuery: Parameters<typeof api.tiers.all>[number] = React.useMemo(
    () => ({
      ...Eagers.tier,
      ...(selectedFederationId > 0
        ? {
            where: {
              league: {
                federations: {
                  some: {
                    id: selectedFederationId,
                  },
                },
              },
            },
          }
        : {}),
    }),
    [selectedFederationId],
  );
  const competitionQuery: Parameters<typeof api.competitions.find>[number] = React.useMemo(
    () => ({
      ...Eagers.competition,
      where: {
        federationId: selectedFederationId,
        season: selectedSeasonId,
        tier: {
          id: selectedTierId,
        },
      },
    }),
    [selectedFederationId, selectedSeasonId, selectedTierId],
  );

  // initial data fetch
  React.useEffect(() => {
    api.federations.all().then(setFederations);
    api.tiers.all(tierQuery).then(setTiers);
  }, []);

  // preload the user's domestic league
  React.useEffect(() => {
    if (!state.profile) {
      return;
    }

    api.competitions
      .find({
        include: Eagers.competition.include,
        where: {
          federationId: userContinent.federationId,
          season: state.profile.season,
          tier: {
            slug: Constants.Prestige[state.profile.team.tier],
          },
        },
      })
      .then((competition) => {
        setCompetition(competition);
      });
  }, [state.profile]);

  // re-fetch tiers when its query changes
  React.useEffect(() => {
    api.tiers.all(tierQuery).then(setTiers);
  }, [tierQuery]);

  // reset tier selection when federation changes
  React.useEffect(() => {
    setSelectedTierId(-1);
  }, [selectedFederationId]);

  // build seasons dropdown data
  const seasons = React.useMemo(() => [...Array(state?.profile?.season || 0)], [state.profile]);

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
          className={cx(location.pathname === TabIdentifier.STANDINGS && 'btn-active!')}
          onClick={() => navigate(TabIdentifier.STANDINGS)}
        >
          {t('shared.standings')}
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
                  value={selectedFederationId || -1}
                >
                  <option disabled value={-1}>
                    {t('main.competitions.select')}
                  </option>
                  {federations.map((federation) => (
                    <option key={federation.id} value={federation.id}>
                      {federation.name}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.competition')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => setSelectedTierId(Number(event.target.value))}
                  value={selectedTierId || -1}
                  disabled={selectedFederationId < 0}
                >
                  <option disabled value={-1}>
                    {t('main.competitions.select')}
                  </option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.league.name} {Constants.IdiomaticTier[tier.slug]}
                    </option>
                  ))}
                </select>
              </article>
            </section>
            <section>
              <header>
                <p>{t('shared.season')}</p>
              </header>
              <article>
                <select
                  className="select"
                  onChange={(event) => setSelectedSeasonId(Number(event.target.value))}
                  value={selectedSeasonId || -1}
                >
                  <option disabled value={-1}>
                    {t('main.competitions.select')}
                  </option>
                  {seasons.map((_, idx) => (
                    <option key={idx + 1 + '__season'} value={idx + 1}>
                      {t('shared.season')} {idx + 1}
                    </option>
                  ))}
                </select>
              </article>
            </section>
          </fieldset>
          <fieldset>
            <section>
              <button
                type="button"
                className="btn btn-primary btn-block col-span-2!"
                disabled={selectedFederationId < 0 || selectedTierId < 0 || selectedSeasonId < 0}
                onClick={() => api.competitions.find(competitionQuery).then(setCompetition)}
              >
                {t('shared.apply')}
              </button>
            </section>
          </fieldset>
        </form>
        {!competition && (
          <section className="center h-full">
            <span className="loading loading-bars" />
          </section>
        )}
        {!!competition && <Outlet context={{ competition } satisfies RouteContextCompetitions} />}
      </main>
    </div>
  );
}
