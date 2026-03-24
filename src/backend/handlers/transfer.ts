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
import { DatabaseClient, WindowManager, Worldgen } from '@liga/backend/lib';

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

    await Worldgen.onTransferOffer({
      payload: JSON.stringify([transfer.id, Constants.TransferStatus.TEAM_ACCEPTED]),
    });

    // send transfers update to all windows
    WindowManager.sendAll(Constants.IPCRoute.TRANSFER_UPDATE);
    return Promise.resolve();
  });
  ipcMain.handle(
    Constants.IPCRoute.TRANSFER_CREATE,
    async (
      _,
      transferDetails: Prisma.TransferCreateInput,
      offerDetails: Prisma.OfferCreateWithoutTransferInput,
    ) => {
      // go directly to `PLAYER_PENDING` if free agent
      transferDetails.status = !transferDetails.to
        ? Constants.TransferStatus.PLAYER_PENDING
        : Constants.TransferStatus.TEAM_PENDING;
      offerDetails.status = transferDetails.status;

      const transfer = await Worldgen.createTransferDiscussion(transferDetails, offerDetails);
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

    await Worldgen.onTransferOffer({
      payload: JSON.stringify([transfer.id, Constants.TransferStatus.TEAM_REJECTED]),
    });

    // send transfers update to all windows
    WindowManager.sendAll(Constants.IPCRoute.TRANSFER_UPDATE);
    return Promise.resolve();
  });
}
