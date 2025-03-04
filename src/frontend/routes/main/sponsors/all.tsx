/**
 * Displays all available sponsors.
 *
 * @module
 */
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { AppStateContext } from '@liga/frontend/redux';
import { SponsorCard } from '@liga/frontend/components';
import { Constants } from '@liga/shared';

/**
 * Exports this module.
 *
 * @exports
 */
export default function () {
  const { state } = React.useContext(AppStateContext);
  const { hydrate, sponsors } = useOutletContext<RouteContextSponsors>();

  return (
    <div className="grid grid-cols-3 gap-5 p-5 xl:grid-cols-4">
      {sponsors.map((sponsor) => (
        <SponsorCard
          key={sponsor.id + '__sponsor'}
          sponsor={sponsor}
          onApply={
            !sponsor.sponsorships.some(
              (sponsorship) =>
                sponsorship.status === Constants.SponsorshipStatus.SPONSOR_ACCEPTED &&
                sponsorship.team.id === state.profile.teamId,
            ) &&
            (() =>
              api.sponsorships
                .create({
                  sponsor: {
                    connect: { id: sponsor.id },
                  },
                  team: {
                    connect: { id: state.profile.teamId },
                  },
                })
                .then(hydrate))
          }
        />
      ))}
    </div>
  );
}
