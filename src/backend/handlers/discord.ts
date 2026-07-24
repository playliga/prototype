/**
 * Discord IPC handlers.
 *
 * @module
 */
import { ipcMain } from 'electron';
import { DatabaseClient, Discord } from '@liga/backend/lib';
import { Constants, Util } from '@liga/shared';

/**
 * Register the IPC event handlers.
 *
 * @function
 */
export default function () {
  ipcMain.handle(Constants.IPCRoute.DISCORD_CONNECT, async () => {
    const profile = await DatabaseClient.prisma.profile.findFirst();
    const settings = Util.loadSettings(profile.settings);

    if (!settings.general.discord) {
      Discord.Client.Instance.log.warn('Discord presence is disabled.');
      return Promise.reject('Discord presence is disabled.');
    }

    const discord = Discord.Client.Instance;
    discord.on(Discord.EventIdentifier.HANDSHAKE, discord.log.debug);
    discord.on(Discord.EventIdentifier.ERROR, discord.log.error);
    discord.on(Discord.EventIdentifier.CLOSE, discord.log.debug);
    return discord.connect();
  });
  ipcMain.handle(Constants.IPCRoute.DISCORD_SET_ACTIVITY, async (_, data: DiscordActivity) => {
    const discord = Discord.Client.Instance;

    try {
      await discord.setActivity(data);
    } catch (error) {
      // if setting an activity fails that's okay
      // because we may just be getting throttled
      discord.log.debug(error);
    }
  });
}
