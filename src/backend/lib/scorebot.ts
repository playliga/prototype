/**
 * CS16 and CSGO scorebot.
 *
 * @see https://github.com/CSGO-Analysis/hltv-scorebot/blob/master/Scorebot.js
 * @see https://github.com/OpenSourceLAN/better-srcds-log-parser
 * @module
 */
import * as GameLogs from './game-logs';
import events from 'node:events';
import log from 'electron-log';

/** @enum {EventIdentifier} */
export enum EventIdentifier {
  GAME_OVER = 'gameover',
  PLAYER_ASSISTED = 'playerassisted',
  PLAYER_CONNECTED = 'playerconnected',
  PLAYER_ENTERED = 'playerentered',
  PLAYER_KILLED = 'playerkilled',
  ROUND_OVER = 'roundover',
  SAY = 'say',
}

/** @interface */
export interface EventPayload {
  timestamp: Date;
}

/** @interface */
export interface EventPayloadGameOver extends EventPayload {
  map: string;
  score: Array<number>;
}

/** @interface */
export interface EventPayloadPlayerAssisted extends EventPayload {
  assist: {
    name: string;
    serverId: string;
    steamId: string;
    team: string;
  };
  victim: {
    name: string;
    serverId: string;
    steamId: string;
    team: string;
  };
}

/** @interface */
export interface EventPayloadPlayerKilled extends EventPayload {
  attacker: {
    name: string;
    serverId: string;
    steamId: string;
    team: string;
  };
  victim: {
    name: string;
    serverId: string;
    steamId: string;
    team: string;
  };
  weapon: string;
  headshot: boolean;
}

/** @interface */
export interface EventPayloadRoundOver extends EventPayload {
  winner: number;
  event: string;
  score: Array<number>;
}

/** @interface */
export interface ScorebotEvents {
  [EventIdentifier.GAME_OVER]: (payload: EventPayloadGameOver) => void;
  [EventIdentifier.PLAYER_ASSISTED]: (payload: EventPayloadPlayerAssisted) => void;
  [EventIdentifier.PLAYER_CONNECTED]: () => void;
  [EventIdentifier.PLAYER_ENTERED]: (payload: string) => void;
  [EventIdentifier.PLAYER_KILLED]: (payload: EventPayloadPlayerKilled) => void;
  [EventIdentifier.ROUND_OVER]: (payload: EventPayloadRoundOver) => void;
  [EventIdentifier.SAY]: (payload: string) => void;
}

/** @constant */
export const TeamIdentifier: Record<string, number> = {
  TERRORIST: 0,
  CT: 1,
};

/** @constant */
export const RegexTypes = {
  GAME_OVER_REGEX: new RegExp(/(?:Game Over)(?:.+)de_(\S+)(?:\D+)([\d]{1,2})\s?:\s?([\d]{1,2})/),
  PLAYER_ASSISTED_REGEX: new RegExp(/"(.+)" assisted killing "(.+)"/),
  PLAYER_CONNECTED_REGEX: new RegExp(/"(?:.+)" connected, address "loopback:0"/),
  PLAYER_ENTERED_REGEX: new RegExp(/"(.+)" entered the game/),
  PLAYER_KILLED_REGEX: new RegExp(
    /"(.+)" (?:\[.+\]\s)?killed "(.+)" (?:\[.+\]\s)?with "(\S+)"\s?(\(headshot\))?/,
  ),
  PLAYER_REGEX: new RegExp(
    /(.+)<(\d+)><(STEAM_\d:\d:\d+|STEAM_ID_LAN|BOT|Console|\[.+\])><(TERRORIST|CT)>?/,
  ),
  PLAYER_REGEX_NO_TEAM: new RegExp(
    /(.+)<(\d+)><(STEAM_\d:\d:\d+|STEAM_ID_LAN|BOT|Console|\[.+\])><>?/,
  ),
  ROUND_OVER_REGEX: new RegExp(
    /Team "(TERRORIST|CT)" triggered "(.+)"(?:.+)\(.+"(\d+)"\)(?:.+)\(.+"(\d+)"\)/,
  ),
  SAY_REGEX: new RegExp(/(?:.)+(?:say|say_team)(?:.)+"(.*)"/),
  TIMESTAMP_REGEX: new RegExp(/^L.+(?<hours>\d{2}):(?<minutes>\d{2}):(?<seconds>\d{2})/),
};

/**
 * Adds types to the event emitter the
 * {Watcher} class is extending.
 *
 * @interface
 */
export interface Watcher {
  on<U extends keyof ScorebotEvents>(event: U, listener: ScorebotEvents[U]): this;
  emit<U extends keyof ScorebotEvents>(event: U, ...args: Parameters<ScorebotEvents[U]>): boolean;
}

/** @class */
export class Watcher extends events.EventEmitter {
  private tail: GameLogs.Client;
  public log: log.LogFunctions;

  constructor(host: string, opts: ConstructorParameters<typeof GameLogs.Client>[1]) {
    super();
    this.log = log.scope('scorebot');
    this.tail = new GameLogs.Client(host, opts);
    this.tail.on(GameLogs.EventIdentifier.ERROR, this.log.error);
    this.tail.on(GameLogs.EventIdentifier.CLOSE, () => this.log.info('Shutdown.'));
  }

  /**
   * Handles incoming line stream data.
   *
   * @param line The line to parse.
   * @function
   */
  private onLine(line: string) {
    // grab current timestamp
    const timestamp = new Date();
    const timestampRegexMatch = line.match(RegexTypes.TIMESTAMP_REGEX);

    if (timestampRegexMatch && timestampRegexMatch.groups) {
      const { hours, minutes, seconds } = timestampRegexMatch.groups;
      timestamp.setHours(Number(hours));
      timestamp.setMinutes(Number(minutes));
      timestamp.setSeconds(Number(seconds));
    }

    // look for SAY events
    let regexmatch = line.match(RegexTypes.SAY_REGEX);

    if (regexmatch) {
      this.emit(EventIdentifier.SAY, regexmatch[1]);
      return;
    }

    // look for GAMEOVER events
    regexmatch = line.match(RegexTypes.GAME_OVER_REGEX);

    if (regexmatch) {
      this.emit(EventIdentifier.GAME_OVER, {
        map: regexmatch[1],
        score: [parseInt(regexmatch[2]), parseInt(regexmatch[3])],
        timestamp,
      });
      return;
    }

    // round end events
    regexmatch = line.match(RegexTypes.ROUND_OVER_REGEX);

    if (regexmatch) {
      this.emit(EventIdentifier.ROUND_OVER, {
        winner: TeamIdentifier[regexmatch[1]], // can be: CT or TERRORIST
        event: regexmatch[2], // e.g.: CTs_Win or Target_Bombed
        score: regexmatch.slice(3).map((score) => parseInt(score)), // e.g.: [ 0 (t) , 1 (ct) ]
        timestamp,
      });
      return;
    }

    // player killed event
    regexmatch = line.match(RegexTypes.PLAYER_KILLED_REGEX);

    if (regexmatch) {
      const [, attackerSignature, victimSignature, weapon, headshot] = regexmatch;
      const [, attackerName, attackerServerId, attackerSteamId, attackerTeam] =
        attackerSignature.match(RegexTypes.PLAYER_REGEX);
      const [, victimName, victimServerId, victimSteamId, victimTeam] = victimSignature.match(
        RegexTypes.PLAYER_REGEX,
      );
      this.emit(EventIdentifier.PLAYER_KILLED, {
        attacker: {
          name: attackerName,
          serverId: attackerServerId,
          steamId: attackerSteamId,
          team: attackerTeam,
        },
        victim: {
          name: victimName,
          serverId: victimServerId,
          steamId: victimSteamId,
          team: victimTeam,
        },
        headshot: Boolean(headshot),
        weapon,
        timestamp,
      });
    }

    // player assisted event
    regexmatch = line.match(RegexTypes.PLAYER_ASSISTED_REGEX);

    if (regexmatch) {
      const [, attackerSignature, victimSignature] = regexmatch;
      const [, attackerName, attackerServerId, attackerSteamId, attackerTeam] =
        attackerSignature.match(RegexTypes.PLAYER_REGEX);
      const [, victimName, victimServerId, victimSteamId, victimTeam] = victimSignature.match(
        RegexTypes.PLAYER_REGEX,
      );
      this.emit(EventIdentifier.PLAYER_ASSISTED, {
        assist: {
          name: attackerName,
          serverId: attackerServerId,
          steamId: attackerSteamId,
          team: attackerTeam,
        },
        victim: {
          name: victimName,
          serverId: victimServerId,
          steamId: victimSteamId,
          team: victimTeam,
        },
        timestamp,
      });
    }

    // player connected event
    regexmatch = line.match(RegexTypes.PLAYER_CONNECTED_REGEX);

    if (regexmatch) {
      this.emit(EventIdentifier.PLAYER_CONNECTED);
    }

    // player entered event
    regexmatch = line.match(RegexTypes.PLAYER_ENTERED_REGEX);

    if (regexmatch) {
      const [, playerSignature] = regexmatch;
      const [, playerName] = playerSignature.match(RegexTypes.PLAYER_REGEX_NO_TEAM);

      if (playerName) {
        this.emit(EventIdentifier.PLAYER_ENTERED, playerName);
      }
    }
  }

  /** @function */
  public async start() {
    this.log.info('Starting...');
    await this.tail.connect();
    this.tail.on(GameLogs.EventIdentifier.MESSAGE, this.onLine.bind(this));
    this.log.info('Connected.');
  }

  /**
   * Cleanly shuts down the tailed file handler.
   *
   * @function
   */
  public quit() {
    this.tail.disconnect();
  }
}
