/**
 * CS16 and CSGO scorebot.
 *
 * @see https://github.com/CSGO-Analysis/hltv-scorebot/blob/master/Scorebot.js
 * @see https://github.com/OpenSourceLAN/better-srcds-log-parser
 * @module
 */
import * as Tail from './tail';
import * as FileManager from './file-manager';
import events from 'node:events';
import readline from 'node:readline';
import log from 'electron-log';

/** @enum {EventIdentifier} */
export enum EventIdentifier {
  GAME_OVER = 'gameover',
  PLAYER_ASSISTED = 'playerassisted',
  PLAYER_CONNECTED = 'playerconnected',
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
  half: number;
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
  half: number;
  headshot: boolean;
}

/** @interface */
export interface EventPayloadRoundOver extends EventPayload {
  winner: number;
  event: string;
  score: Array<number>;
  half: number;
}

/** @interface */
export interface ScorebotEvents {
  [EventIdentifier.GAME_OVER]: (payload: EventPayloadGameOver) => void;
  [EventIdentifier.PLAYER_ASSISTED]: (payload: EventPayloadPlayerAssisted) => void;
  [EventIdentifier.PLAYER_CONNECTED]: () => void;
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
  HALF_TIME_SUFFIX_REGEX: new RegExp(/\s(?:Half:)\s"(\d)"$/i),
  GAME_OVER_REGEX: new RegExp(/(?:Game Over)(?:.+)de_(\S+)(?:\D+)([\d]{1,2})\s?:\s?([\d]{1,2})/),
  PLAYER_ASSISTED_REGEX: new RegExp(/"(.+)" assisted killing "(.+)"/),
  PLAYER_CONNECTED_REGEX: new RegExp(/"(?:.+)" connected, address "loopback:0"/),
  PLAYER_KILLED_REGEX: new RegExp(
    /"(.+)" (?:\[.+\]\s)?killed "(.+)" (?:\[.+\]\s)?with "(\S+)"\s+?(\(headshot\))?/,
  ),
  PLAYER_REGEX: new RegExp(
    /(.+)<(\d+)><(STEAM_\d:\d:\d+|STEAM_ID_LAN|BOT|Console|\[.+\])><(TERRORIST|CT)>?/,
  ),
  ROUND_OVER_REGEX: new RegExp(
    /Team "(TERRORIST|CT)" triggered "(.+)"(?:.+)\(.+"(\d+)"\)(?:.+)\(.+"(\d+)"\)/,
  ),
  SAY_REGEX: new RegExp(/(?:.)+(?:say|say_team)(?:.)+"(.*)"/),
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
  private file: string;
  private tail: Tail.Watcher;
  private lineSplitter: readline.Interface;
  public log: log.LogFunctions;

  constructor(file: string) {
    super();
    this.file = file;
    this.log = log.scope('scorebot');
    this.tail = new Tail.Watcher(file, { encoding: 'utf8' });
    this.tail.on(Tail.EventIdentifier.TAIL_ERROR, this.log.error);
    this.tail.on(Tail.EventIdentifier.ERROR, this.log.error);
    this.tail.on(Tail.EventIdentifier.CLOSE, () => this.log.info('Shutdown.'));
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

    // grab halftime status information
    const halfRegexMatch = line.match(RegexTypes.HALF_TIME_SUFFIX_REGEX);
    const half = halfRegexMatch !== null ? Number(halfRegexMatch[1]) : -1;

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
        half,
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
        half,
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
        half,
        timestamp,
      });
    }

    // player connected event
    regexmatch = line.match(RegexTypes.PLAYER_CONNECTED_REGEX);

    if (regexmatch) {
      this.emit(EventIdentifier.PLAYER_CONNECTED);
    }
  }

  /**
   * Starts tailing the server log file.
   *
   * Pipes the file stream into `readline` which then breaks up the data
   * into newlines. This helps with performance when tailing the server
   * logs which contain a lot of throughput, e.g.: `bot_kill`.
   *
   * @see https://www.npmjs.com/package/@logdna/tail-file#example-using-readline
   * @function
   */
  public async start() {
    // handle race condition where this is called before the path
    // to the log file can be created by the game server
    try {
      await FileManager.touch(this.file);
    } catch (error) {
      this.log.error(error);
      throw error;
    }

    // if we got this far; we can tail the log file
    try {
      this.log.info('Starting...');
      await this.tail.start();
      this.lineSplitter = readline.createInterface({ input: this.tail });
      this.lineSplitter.on('line', this.onLine.bind(this));
      this.log.info('Connected.');
      return Promise.resolve();
    } catch (error) {
      this.log.error(error);
      throw error;
    }
  }

  /**
   * Cleanly shuts down the tailed file handler.
   *
   * @function
   */
  public quit() {
    return this.tail.quit();
  }
}
