/**
 * Sponsors IPC handlers.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { Prisma } from '@prisma/client';
import { random } from 'lodash';
import { addDays, addYears } from 'date-fns';
import { Constants } from '@liga/shared';
import { DatabaseClient } from '@liga/backend/lib';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.SPONSORS_ALL, (_, query?: Prisma.SponsorFindManyArgs) =>
    DatabaseClient.prisma.sponsor.findMany(query),
  );
  ipcMain.handle(
    Constants.IPCRoute.SPONSORSHIP_CREATE,
    async (_, sponsorshipDetails: Prisma.SponsorshipCreateInput) => {
      // find the sponsor's terms
      const sponsor = await DatabaseClient.prisma.sponsor.findFirst({
        where: { id: sponsorshipDetails.sponsor.connect.id },
      });
      const [terms] = Constants.SponsorContract[sponsor.slug as Constants.SponsorSlug].terms;

      // calculate offer start and end based on season
      const profile = await DatabaseClient.prisma.profile.findFirst();
      const offerStart = new Date(
        profile.date.getFullYear(),
        Constants.Application.SEASON_START_MONTH,
        Constants.Application.SEASON_START_DAY,
      );
      const offerEnd = addYears(offerStart, terms.length);

      // build offer database record
      const offer = {
        status: Constants.SponsorshipStatus.SPONSOR_PENDING,
        start: offerStart.toISOString(),
        end: offerEnd.toISOString(),
        amount: terms.amount,
        frequency: terms.frequency,
      };

      // see if there's an active discussion
      // happening between these two parties
      let sponsorship = await DatabaseClient.prisma.sponsorship.findFirst({
        where: {
          sponsor: {
            id: sponsorshipDetails.sponsor.connect.id,
          },
          team: {
            id: sponsorshipDetails.team.connect.id,
          },
        },
      });

      // create the sponsorship if it doesn't already exist.
      if (!sponsorship) {
        sponsorship = await DatabaseClient.prisma.sponsorship.create({
          data: {
            ...sponsorshipDetails,
            status: Constants.SponsorshipStatus.SPONSOR_PENDING,
            offers: {
              create: [offer],
            },
          },
        });
      } else {
        // attach new offer to existing sponsorship
        await DatabaseClient.prisma.sponsorship.update({
          where: {
            id: sponsorship.id,
          },
          data: {
            status: Constants.SponsorshipStatus.SPONSOR_PENDING,
            offers: {
              create: [offer],
            },
          },
        });
      }

      // schedule when to send a response
      return DatabaseClient.prisma.calendar.create({
        data: {
          type: Constants.CalendarEntry.SPONSORSHIP_PARSE,
          date: addDays(
            profile.date,
            random(
              Constants.TransferSettings.RESPONSE_MIN_DAYS,
              Constants.TransferSettings.RESPONSE_MAX_DAYS,
            ),
          ).toISOString(),
          payload: String(sponsorship.id),
        },
      });
    },
  );
}
