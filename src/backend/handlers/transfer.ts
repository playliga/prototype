/**
 * Transfer Offer IPC handlers.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { addDays } from 'date-fns';
import { random } from 'lodash';
import { Prisma } from '@prisma/client';
import { Constants } from '@liga/shared';
import { DatabaseClient, Worldgen } from '@liga/backend/lib';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.TRANSFER_ALL, async (_, query: Prisma.TransferFindManyArgs) => {
    const transfers = await DatabaseClient.prisma.transfer.findMany(query);
    return transfers;
  });
  ipcMain.handle(Constants.IPCRoute.TRANSFER_ACCEPT, async (_, id: string) => {
    const transfer = await DatabaseClient.prisma.transfer.findFirst({
      where: { id: Number(id) },
      include: {
        offers: { orderBy: { id: 'desc' } },
      },
    });

    return Worldgen.onTransferOffer({
      payload: JSON.stringify([transfer.id, Constants.TransferStatus.TEAM_ACCEPTED]),
    });
  });
  ipcMain.handle(
    Constants.IPCRoute.TRANSFER_CREATE,
    async (
      _,
      transferDetails: Prisma.TransferCreateInput,
      offerDetails: Partial<Prisma.OfferCreateInput>,
    ) => {
      // see if there's an active transfer discussion
      // happening between these two parties
      let transfer = await DatabaseClient.prisma.transfer.findFirst({
        where: {
          from: {
            id: transferDetails.from.connect.id,
          },
          to: {
            id: transferDetails.to?.connect?.id,
          },
          target: {
            id: transferDetails.target.connect.id,
          },
        },
      });

      // create the transfer if it doesn't already exist.
      if (!transfer) {
        transfer = await DatabaseClient.prisma.transfer.create({
          data: {
            ...transferDetails,
            status: !transferDetails.to
              ? Constants.TransferStatus.PLAYER_PENDING
              : Constants.TransferStatus.TEAM_PENDING,
            offers: {
              create: [
                {
                  ...offerDetails,
                  status: !transferDetails.to
                    ? Constants.TransferStatus.PLAYER_PENDING
                    : Constants.TransferStatus.TEAM_PENDING,
                },
              ],
            },
          },
        });
      } else {
        // otherwise attach new offer to existing transfer
        await DatabaseClient.prisma.offer.create({
          data: {
            status: transfer.status,
            cost: offerDetails.cost,
            wages: offerDetails.wages,
            transfer: {
              connect: {
                id: transfer.id,
              },
            },
          },
        });
      }

      // schedule when to send a response
      const profile = await DatabaseClient.prisma.profile.findFirst();
      return DatabaseClient.prisma.calendar.create({
        data: {
          type: Constants.CalendarEntry.TRANSFER_PARSE,
          date: addDays(
            profile.date,
            random(
              Constants.TransferSettings.RESPONSE_MIN_DAYS,
              Constants.TransferSettings.RESPONSE_MAX_DAYS,
            ),
          ).toISOString(),
          payload: String(transfer.id),
        },
      });
    },
  );
  ipcMain.handle(Constants.IPCRoute.TRANSFER_REJECT, async (_, id: string) => {
    const transfer = await DatabaseClient.prisma.transfer.findFirst({
      where: { id: Number(id) },
      include: {
        offers: { orderBy: { id: 'desc' } },
      },
    });

    return Worldgen.onTransferOffer({
      payload: JSON.stringify([transfer.id, Constants.TransferStatus.TEAM_REJECTED]),
    });
  });
}
