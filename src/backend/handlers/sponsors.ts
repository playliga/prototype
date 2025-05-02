/**
 * Sponsors IPC handlers.
 *
 * @module
 */
import * as Sqrl from 'squirrelly';
import log from 'electron-log';
import { ipcMain } from 'electron';
import { Prisma } from '@prisma/client';
import { random, sample } from 'lodash';
import { addDays, addYears } from 'date-fns';
import { Constants, Eagers } from '@liga/shared';
import { DatabaseClient, getLocale, Worldgen } from '@liga/backend/lib';

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
  ipcMain.handle(Constants.IPCRoute.SPONSORSHIP_INVITE_ACCEPT, async (_, id: string) => {
    // load user locale
    const profile = await DatabaseClient.prisma.profile.findFirst<typeof Eagers.profile>();
    const locale = getLocale(profile);

    // load sponsorship record
    const sponsorship = await DatabaseClient.prisma.sponsorship.findFirst({
      ...Eagers.sponsorship,
      where: { id: Number(id) },
    });

    if (!sponsorship) {
      log.warn('sponsorship (id=%d) not found.', id);
      return;
    }

    // bail if contract is not active
    const contract = Constants.SponsorContract[sponsorship.sponsor.slug as Constants.SponsorSlug];

    if (sponsorship.status !== Constants.SponsorshipStatus.SPONSOR_ACCEPTED) {
      log.warn('contract between %s and %s is not active.', sponsorship.sponsor.name, profile.name);
      return;
    }

    // load competition record
    const competition = await DatabaseClient.prisma.competition.findFirst({
      ...Eagers.competition,
      where: {
        season: profile.season,
        status: {
          not: Constants.CompetitionStatus.STARTED,
        },
        tier: {
          slug: contract.tournament,
        },
      },
    });

    if (!competition) {
      log.warn('competition for %s not found or already started.', sponsorship.sponsor.name);
      return;
    }

    // bail if user's team is already in the competition
    const team = competition.competitors.find((competitor) => competitor.teamId === profile.teamId);

    if (team) {
      log.warn('user team already in %s. skipping...', sponsorship.sponsor.name);
    }

    // replace random team with user's team
    // and send an accepted response
    return Promise.all([
      DatabaseClient.prisma.competition.update({
        where: { id: competition.id },
        data: {
          competitors: {
            update: {
              where: {
                id: sample(competition.competitors).id,
              },
              data: {
                teamId: profile.teamId,
              },
            },
          },
        },
      }),
      Worldgen.sendEmail(
        Sqrl.render(locale.templates.SponsorshipInvite.SUBJECT, { sponsorship }),
        Sqrl.render(locale.templates.SponsorshipInviteAcceptedUser.CONTENT, { sponsorship }),
        profile.team.personas[0],
        profile.date,
      ),
    ]);
  });
  ipcMain.handle(Constants.IPCRoute.SPONSORSHIP_INVITE_REJECT, async (_, id: string) => {
    // load user locale
    const profile = await DatabaseClient.prisma.profile.findFirst<typeof Eagers.profile>();
    const locale = getLocale(profile);

    // load sponsorship record
    const sponsorship = await DatabaseClient.prisma.sponsorship.findFirst({
      ...Eagers.sponsorship,
      where: { id: Number(id) },
    });

    if (!sponsorship) {
      log.warn('sponsorship (id=%d) not found.', id);
      return;
    }

    // send rejected response
    return Worldgen.sendEmail(
      Sqrl.render(locale.templates.SponsorshipInvite.SUBJECT, { sponsorship }),
      Sqrl.render(locale.templates.SponsorshipInviteRejectedUser.CONTENT, { sponsorship }),
      profile.team.personas[0],
      profile.date,
    );
  });
}
