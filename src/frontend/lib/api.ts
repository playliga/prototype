/**
 * Electron API context bridge functions.
 *
 * @note The shared module can't be imported because this module breaks, for some reason.
 * @see https://www.electronjs.org/docs/latest/tutorial/ipc#ipc-channels
 * @module
 */
import * as Constants from '@liga/shared/constants';
import * as Eagers from '@liga/shared/eagers';
import type AppInfo from 'package.json';
import type { Prisma, Profile, Team, Calendar } from '@prisma/client';
import { ipcRenderer } from 'electron';

/** @type {IPCRendererCallback} */
type IPCRendererCallback = (...args: unknown[]) => void;

/**
 * Exports this module.
 *
 * @exports
 */
export default {
  achievements: {
    all: () =>
      ipcRenderer.invoke(Constants.IPCRoute.ACHIEVEMENTS_ALL) as Promise<
        Array<Prisma.AchievementGetPayload<unknown>>
      >,
  },
  app: {
    detectGame: (game: Constants.Game) =>
      ipcRenderer.invoke(Constants.IPCRoute.APP_DETECT_GAME, game) as Promise<string>,
    detectSteam: () => ipcRenderer.invoke(Constants.IPCRoute.APP_DETECT_STEAM) as Promise<string>,
    dialog: (parentId: string, options: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke(
        Constants.IPCRoute.APP_DIALOG,
        parentId,
        options,
      ) as Promise<Electron.OpenDialogReturnValue>,
    external: (url: string) => ipcRenderer.invoke(Constants.IPCRoute.APP_EXTERNAL, url),
    locale: () => ipcRenderer.invoke(Constants.IPCRoute.APP_LOCALE) as Promise<LocaleData>,
    messageBox: (parentId: string, options: Electron.MessageBoxOptions) =>
      ipcRenderer.invoke(
        Constants.IPCRoute.APP_MESSAGE_BOX,
        parentId,
        options,
      ) as Promise<Electron.MessageBoxReturnValue>,
    info: () => ipcRenderer.invoke(Constants.IPCRoute.APP_INFO) as Promise<typeof AppInfo>,
    quit: () => ipcRenderer.invoke(Constants.IPCRoute.APP_QUIT) as Promise<unknown>,
    status: (settings?: typeof Constants.Settings) =>
      ipcRenderer.invoke(Constants.IPCRoute.APP_STATUS, settings),
    upload: (file: string) =>
      ipcRenderer.invoke(Constants.IPCRoute.APP_UPLOAD, file) as Promise<string>,
    whatsNew: () => ipcRenderer.invoke(Constants.IPCRoute.APP_WHATS_NEW) as Promise<void>,
  },
  blazonry: {
    all: () => ipcRenderer.invoke(Constants.IPCRoute.BLAZONRY_ALL),
  },
  bonus: {
    all: () =>
      ipcRenderer.invoke(Constants.IPCRoute.BONUS_ALL) as Promise<
        Array<Prisma.BonusGetPayload<unknown>>
      >,
    buy: (id: number) => ipcRenderer.invoke(Constants.IPCRoute.BONUS_BUY, id) as Promise<unknown>,
  },
  calendar: {
    create: (data: Prisma.CalendarCreateInput) =>
      ipcRenderer.invoke(Constants.IPCRoute.CALENDAR_CREATE, data) as Promise<Calendar>,
    find: (query: Prisma.CalendarFindFirstArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.CALENDAR_FIND, query) as Promise<
        Prisma.CalendarGetPayload<unknown>
      >,
    sim: () => ipcRenderer.invoke(Constants.IPCRoute.CALENDAR_SIM),
    start: (max?: number) => ipcRenderer.invoke(Constants.IPCRoute.CALENDAR_START, max),
    stop: () => ipcRenderer.invoke(Constants.IPCRoute.CALENDAR_STOP),
  },
  competitions: {
    all: <T = typeof Eagers.competition>(query: Prisma.CompetitionFindManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.COMPETITIONS_ALL, query) as Promise<
        Array<Prisma.CompetitionGetPayload<T>>
      >,
    find: <T = typeof Eagers.competition>(query: Prisma.CompetitionFindFirstArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.COMPETITIONS_FIND, query) as Promise<
        Prisma.CompetitionGetPayload<T>
      >,
    winners: (id: number) =>
      ipcRenderer.invoke(Constants.IPCRoute.COMPETITIONS_WINNERS, id) as Promise<
        Prisma.CompetitionGetPayload<typeof Eagers.competition>['competitors']
      >,
  },
  continents: {
    all: <T = typeof Eagers.continent>(query: Prisma.ContinentFindManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.CONTINENTS_ALL, query) as Promise<
        Array<Prisma.ContinentGetPayload<T>>
      >,
  },
  database: {
    connect: (id?: string) => ipcRenderer.invoke(Constants.IPCRoute.DATABASE_CONNECT, id),
    disconnect: () => ipcRenderer.invoke(Constants.IPCRoute.DATABASE_DISCONNECT),
  },
  emails: {
    all: <T = typeof Eagers.email>(query: Prisma.EmailFindManyArgs = Eagers.email) =>
      ipcRenderer.invoke(Constants.IPCRoute.EMAILS_ALL, query) as Promise<
        Array<Prisma.EmailGetPayload<T>>
      >,
    delete: (ids: Array<number>) =>
      ipcRenderer.invoke(Constants.IPCRoute.EMAILS_DELETE, ids) as Promise<unknown>,
    updateDialogue: <T = typeof Eagers.email>(query: Prisma.DialogueUpdateArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.EMAILS_UPDATE_DIALOGUE, query) as Promise<
        Prisma.EmailGetPayload<T>
      >,
    updateMany: <T = typeof Eagers.email>(query: Prisma.EmailUpdateManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.EMAILS_UPDATE_MANY, query) as Promise<
        Array<Prisma.EmailGetPayload<T>>
      >,
  },
  federations: {
    all: <T = unknown>() =>
      ipcRenderer.invoke(Constants.IPCRoute.FEDERATIONS_ALL) as Promise<
        Array<Prisma.FederationGetPayload<T>>
      >,
  },
  ipc: {
    invoke: (route: string, payload: unknown) =>
      ipcRenderer.invoke(route, payload) as Promise<unknown>,
    on: (route: string, cb: IPCRendererCallback) => ipcRenderer.on(route, (_, args) => cb(args)),
  },
  issues: {
    all: () =>
      ipcRenderer.invoke(Constants.IPCRoute.ISSUES_ALL) as Promise<Array<GitHubIssueResponse>>,
    comments: (id: number) =>
      ipcRenderer.invoke(Constants.IPCRoute.ISSUES_COMMENTS, id) as Promise<
        Array<GitHubCommentResponse>
      >,
    create: (data: unknown) =>
      ipcRenderer.invoke(Constants.IPCRoute.ISSUES_CREATE, data) as Promise<GitHubIssueResponse>,
    createComment: (id: number, data: unknown) =>
      ipcRenderer.invoke(
        Constants.IPCRoute.ISSUES_COMMENTS_CREATE,
        id,
        data,
      ) as Promise<GitHubCommentResponse>,
    find: (id: number) =>
      ipcRenderer.invoke(Constants.IPCRoute.ISSUES_FIND, id) as Promise<GitHubIssueResponse>,
  },
  mapPool: {
    find: (query: Prisma.MapPoolFindManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.MAP_POOL_FIND, query) as Promise<
        Array<Prisma.MapPoolGetPayload<typeof Eagers.mapPool>>
      >,
    update: (query: Prisma.MapPoolUpdateArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.MAP_POOL_UPDATE, query) as Promise<unknown>,
    updateMany: (query: Prisma.MapPoolUpdateManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.MAP_POOL_UPDATE_MANY, query) as Promise<unknown>,
  },
  match: {
    find: (query: Prisma.MatchFindFirstArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.MATCH_FIND, query) as Promise<
        Prisma.MatchGetPayload<unknown>
      >,
    updateMapList: (id: number, mapList: Array<string>) =>
      ipcRenderer.invoke(Constants.IPCRoute.MATCH_UPDATE_MAP_LIST, id, mapList) as Promise<unknown>,
  },
  matches: {
    all: <T = typeof Eagers.match>(query: Prisma.MatchFindManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.MATCHES_ALL, query) as Promise<
        Array<Prisma.MatchGetPayload<T>>
      >,
    count: (where?: Prisma.MatchWhereInput) =>
      ipcRenderer.invoke(Constants.IPCRoute.MATCHES_COUNT, where) as Promise<number>,
    previous: <T = typeof Eagers.match>(
      query: Prisma.MatchFindManyArgs,
      id: number,
      limit?: number,
    ) =>
      ipcRenderer.invoke(Constants.IPCRoute.MATCHES_PREVIOUS, query, id, limit) as Promise<
        Array<Prisma.MatchGetPayload<T>>
      >,
    upcoming: <T = typeof Eagers.match>(query: Partial<Prisma.MatchFindManyArgs>, limit?: number) =>
      ipcRenderer.invoke(Constants.IPCRoute.MATCHES_UPCOMING, query, limit) as Promise<
        Array<Prisma.MatchGetPayload<T>>
      >,
  },
  mods: {
    all: () => ipcRenderer.invoke(Constants.IPCRoute.MODS_ALL) as Promise<Array<ModMetadata>>,
    delete: () => ipcRenderer.invoke(Constants.IPCRoute.MODS_DELETE) as Promise<Array<void>>,
    download: (name: string) => ipcRenderer.send(Constants.IPCRoute.MODS_DOWNLOAD, name),
    installed: () => ipcRenderer.invoke(Constants.IPCRoute.MODS_GET_INSTALLED) as Promise<string>,
  },
  play: {
    exhibition: (settings: typeof Constants.Settings, teamIds: Array<number>, teamId: number) =>
      ipcRenderer.invoke(Constants.IPCRoute.PLAY_EXHIBITION, settings, teamIds, teamId),
    start: (spectating?: boolean) => ipcRenderer.invoke(Constants.IPCRoute.PLAY_START, spectating),
  },
  plugins: {
    start: () => ipcRenderer.send(Constants.IPCRoute.PLUGINS_START),
  },
  players: {
    all: <T = typeof Eagers.player>(query?: Prisma.PlayerFindManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.PLAYERS_ALL, query) as Promise<
        Array<Prisma.PlayerGetPayload<T>>
      >,
    count: (where?: Prisma.PlayerWhereInput) =>
      ipcRenderer.invoke(Constants.IPCRoute.PLAYERS_COUNT, where) as Promise<number>,
    find: <T = typeof Eagers.player>(query: Prisma.PlayerFindFirstArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.PLAYERS_FIND, query) as Promise<
        Prisma.PlayerGetPayload<T>
      >,
  },
  profiles: {
    create: (
      data: {
        user?: Partial<Prisma.PlayerGetPayload<unknown>>;
        team?: Partial<Prisma.TeamGetPayload<unknown>>;
        today?: Date;
      },
      settings?: string,
    ) => ipcRenderer.invoke(Constants.IPCRoute.PROFILES_CREATE, data, settings) as Promise<Profile>,
    current: <T = typeof Eagers.profile>() =>
      ipcRenderer.invoke(Constants.IPCRoute.PROFILES_CURRENT) as Promise<
        Prisma.ProfileGetPayload<T>
      >,
    train: (bonusIds: Array<number>) =>
      ipcRenderer.invoke(Constants.IPCRoute.PROFILES_TRAIN, bonusIds) as Promise<unknown>,
    update: <T = unknown>(query: Prisma.ProfileUpdateArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.PROFILES_UPDATE, query) as Promise<
        Prisma.ProfileGetPayload<T>
      >,
  },
  saves: {
    all: <T = typeof Eagers.profile>() =>
      ipcRenderer.invoke(Constants.IPCRoute.SAVES_ALL) as Promise<
        Array<Prisma.ProfileGetPayload<T>>
      >,
    delete: (id: number) => ipcRenderer.invoke(Constants.IPCRoute.SAVES_DELETE, id),
  },
  shortlist: {
    all: <T = typeof Eagers.shortlist>(query?: Prisma.ShortlistFindManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.SHORTLIST_ALL, query) as Promise<
        Array<Prisma.ShortlistGetPayload<T>>
      >,
    create: (query: Prisma.ShortlistCreateArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.SHORTLIST_CREATE, query),
    delete: (query: Prisma.ShortlistDeleteArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.SHORTLIST_DELETE, query),
  },
  sponsors: {
    all: <T = typeof Eagers.sponsor>(query?: Prisma.SponsorFindManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.SPONSORS_ALL, query) as Promise<
        Array<Prisma.SponsorGetPayload<T>>
      >,
  },
  sponsorships: {
    create: (sponsorship: Partial<Prisma.SponsorshipCreateInput>) =>
      ipcRenderer.invoke(Constants.IPCRoute.SPONSORSHIP_CREATE, sponsorship) as Promise<
        Prisma.SponsorshipGetPayload<unknown>
      >,
  },
  squad: {
    all: <T = typeof Eagers.player>() =>
      ipcRenderer.invoke(Constants.IPCRoute.SQUAD_ALL) as Promise<
        Array<Prisma.PlayerGetPayload<T>>
      >,
    update: <T = typeof Eagers.player>(query: Prisma.PlayerUpdateArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.SQUAD_UPDATE, query) as Promise<
        Array<Prisma.PlayerGetPayload<T>>
      >,
    release: <T = typeof Eagers.player>(query: Prisma.PlayerUpdateArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.SQUAD_RELEASE_PLAYER, query) as Promise<
        Array<Prisma.PlayerGetPayload<T>>
      >,
  },
  team: {
    transfers: <T = typeof Eagers.transfer>(id: number) =>
      ipcRenderer.invoke(Constants.IPCRoute.TEAM_TRANSFERS, id) as Promise<
        Array<Prisma.TransferGetPayload<T>>
      >,
    worldRanking: (id: number) =>
      ipcRenderer.invoke(Constants.IPCRoute.TEAM_RANKING, id) as Promise<number>,
  },
  teams: {
    all: <T = unknown>(query?: Prisma.TeamFindManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.TEAMS_ALL, query) as Promise<
        Array<Prisma.TeamGetPayload<T>>
      >,
    create: (data: Prisma.TeamCreateInput) =>
      ipcRenderer.invoke(Constants.IPCRoute.TEAMS_CREATE, data) as Promise<Team>,
    update: <T = unknown>(query: Prisma.TeamUpdateArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.TEAMS_UPDATE, query) as Promise<
        Prisma.TeamGetPayload<T>
      >,
  },
  tiers: {
    all: <T = typeof Eagers.tier>(query?: Prisma.TierFindManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.TIERS_ALL, query) as Promise<
        Array<Prisma.TierGetPayload<T>>
      >,
  },
  transfers: {
    accept: (id: number) => ipcRenderer.invoke(Constants.IPCRoute.TRANSFER_ACCEPT, id),
    all: <T = typeof Eagers.transfer>(query: Prisma.TransferFindManyArgs) =>
      ipcRenderer.invoke(Constants.IPCRoute.TRANSFER_ALL, query) as Promise<
        Array<Prisma.TransferGetPayload<T>>
      >,
    create: (
      transfer: Partial<Prisma.TransferCreateInput>,
      offer: Partial<Prisma.OfferCreateInput>,
    ) =>
      ipcRenderer.invoke(Constants.IPCRoute.TRANSFER_CREATE, transfer, offer) as Promise<
        Prisma.TransferGetPayload<typeof Eagers.transfer>
      >,
    reject: (id: number) => ipcRenderer.invoke(Constants.IPCRoute.TRANSFER_REJECT, id),
  },
  updater: {
    install: () => ipcRenderer.send(Constants.IPCRoute.UPDATER_INSTALL),
    start: () => ipcRenderer.send(Constants.IPCRoute.UPDATER_START),
  },
  window: {
    close: (id: string) => ipcRenderer.send(Constants.IPCRoute.WINDOW_CLOSE, id),
    open: (id: string) => ipcRenderer.send(Constants.IPCRoute.WINDOW_OPEN, id),
    send: <T = unknown>(id: string, data: T, delay = 500) =>
      ipcRenderer.send(Constants.IPCRoute.WINDOW_SEND, id, data, delay),
  },
};
