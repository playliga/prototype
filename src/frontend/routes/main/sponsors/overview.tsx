/**
 * Sponsors overview route.
 *
 * @module
 */
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Constants } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';
import { useTranslation } from '@liga/frontend/hooks';
import { SponsorCard } from '@liga/frontend/components';
import { FaMoneyBillWave } from 'react-icons/fa';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const t = useTranslation('windows');
  const { state } = React.useContext(AppStateContext);
  const { sponsors } = useOutletContext<RouteContextSponsors>();

  // filter by user sponsors
  const userSponsors = React.useMemo(
    () =>
      sponsors.filter((sponsor) =>
        sponsor.sponsorships.some(
          (sponsorship) =>
            sponsorship.status === Constants.SponsorshipStatus.SPONSOR_ACCEPTED &&
            sponsorship.team.id === state.profile.teamId,
        ),
      ),
    [sponsors],
  );

  if (!userSponsors.length) {
    return (
      <section className="center">
        <FaMoneyBillWave className="text-muted size-24" />
        <p>{t('main.sponsors.noSponsorships')}</p>
      </section>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-5 p-5 xl:grid-cols-4">
      {userSponsors.map((sponsor) => (
        <SponsorCard key={sponsor.id + '__sponsor'} sponsor={sponsor} />
      ))}
    </div>
  );
}
