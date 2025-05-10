/**
 * Renders the layout for the sponsors route.
 *
 * @module
 */
import React from 'react';
import cx from 'classnames';
import { startCase } from 'lodash';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Constants, Eagers, Util } from '@liga/shared';
import { useTranslation } from '@liga/frontend/hooks';

/** @enum */
enum TabIdentifier {
  MY_SPONSORS = '/sponsors',
  ALL_SPONSORS = '/sponsors/all',
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
  const [sponsors, setSponsors] = React.useState<RouteContextSponsors['sponsors']>([]);

  // child routes can use this function to trigger
  // a data fetch after data manipulation
  const hydrate = () => {
    api.sponsors.all(Eagers.sponsor).then(setSponsors);
  };

  // initial data fetch
  React.useEffect(hydrate, []);

  // filter out pending offers
  const pendingOffers = React.useMemo(
    () =>
      sponsors.filter((sponsor) =>
        sponsor.sponsorships.some((sponsorship) =>
          sponsorship.offers.some(
            (offer) => offer.status === Constants.SponsorshipStatus.SPONSOR_PENDING,
          ),
        ),
      ),
    [sponsors],
  );

  // filter out past offers
  const pastOffers = React.useMemo(
    () =>
      sponsors.filter((sponsor) =>
        sponsor.sponsorships.some((sponsorship) =>
          sponsorship.offers.some(
            (offer) =>
              offer.status !== Constants.SponsorshipStatus.SPONSOR_PENDING &&
              offer.status !== Constants.SponsorshipStatus.TEAM_PENDING,
          ),
        ),
      ),
    [sponsors],
  );

  return (
    <div className="dashboard">
      <header>
        <button
          className={cx(location.pathname === TabIdentifier.MY_SPONSORS && 'btn-active!')}
          onClick={() => navigate(TabIdentifier.MY_SPONSORS)}
        >
          {t('main.sponsors.mySponsors')}
        </button>
        <button
          className={cx(location.pathname === TabIdentifier.ALL_SPONSORS && 'btn-active!')}
          onClick={() => navigate(TabIdentifier.ALL_SPONSORS)}
        >
          {t('main.sponsors.allSponsors')}
        </button>
      </header>
      <main>
        <section className="divide-base-content/10 divide-y">
          <article className="stack-y gap-0!">
            <header className="prose border-t-0!">
              <h2>{t('main.sponsors.pendingOffers')}</h2>
            </header>
            {!pendingOffers.length && (
              <footer className="center h-32">
                <p>{t('main.sponsors.noPendingOffers')}</p>
              </footer>
            )}
            {!!pendingOffers.length && (
              <footer>
                <table className="table table-fixed">
                  <thead>
                    <tr>
                      <th className="w-1/2">{t('main.sponsors.to')}</th>
                      <th className="w-1/2 text-center">{t('main.sponsors.terms')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOffers.map((offer) => (
                      <tr key={offer.id + '__pending_offer'}>
                        <td title={offer.name}>{offer.name}</td>
                        <td className="text-center">
                          {(() => {
                            const [terms] =
                              Constants.SponsorContract[offer.slug as Constants.SponsorSlug].terms;
                            const frequency = startCase(
                              Constants.CalendarFrequency[terms.frequency].toLowerCase(),
                            );

                            return (
                              <span>
                                {Util.formatCurrency(terms.amount)} / {frequency}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </footer>
            )}
          </article>
          <article className="stack-y gap-0!">
            <header className="prose border-t-0!">
              <h2>{t('main.sponsors.pastOffers')}</h2>
            </header>
            {!pastOffers.length && (
              <footer className="center h-32">
                <p>{t('main.sponsors.noPastOffers')}</p>
              </footer>
            )}
            {!!pastOffers.length && (
              <footer>
                <table className="table table-fixed">
                  <thead>
                    <tr>
                      <th className="w-1/2">{t('main.sponsors.to')}</th>
                      <th className="w-1/2 text-center">{t('shared.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastOffers.map((offer) => (
                      <tr key={offer.id + '__past_offer'}>
                        <td title={offer.name}>{offer.name}</td>
                        <td className="text-center">
                          {Constants.IdiomaticSponsorshipStatus[offer.sponsorships[0].status]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </footer>
            )}
          </article>
        </section>
        <Outlet context={{ hydrate, sponsors } satisfies RouteContextSponsors} />
      </main>
    </div>
  );
}
