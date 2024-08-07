/**
 * CS16 and CSGO scorebot.
 *
 * @see https://github.com/CSGO-Analysis/hltv-scorebot/blob/master/Scorebot.js
 * @see https://github.com/OpenSourceLAN/better-srcds-log-parser
 * @module
 */
import events from 'node:events';
import readline from 'node:readline';
import log from 'electron-log';
import Tail from '@logdna/tail-file';

/** @enum {EventIdentifier} */
export enum EventIdentifier {
  GAME_OVER = 'gameover',
  PLAYER_KILLED = 'playerkilled',
  ROUND_OVER = 'roundover',
  SAY = 'say',
}

/** @interface */
export interface EventPayloadGameOver {
  map: string;
  score: Array<number>;
}

/** @interface */
export interface EventPayloadPlayerKilled {
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
}

/** @interface */
export interface EventPayloadRoundOver {
  winner: number;
  event: string;
  score: Array<number>;
}

/** @interface */
export interface ScorebotEvents {
  [EventIdentifier.GAME_OVER]: (payload: EventPayloadGameOver) => void;
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
  PLAYER_KILLED_REGEX: new RegExp(/"(.+) killed "(.+) with "(.+)"/),
  PLAYER_REGEX: new RegExp(/(.+)<(\d+)><(STEAM_\d:\d:\d+|BOT|Console)><(TERRORIST|CT)>"?/),
  ROUND_OVER_REGEX: new RegExp(/Team "(TERRORIST|CT)" triggered "(.+)" (?:.)+(\d)(?:.)+(\d)/),
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
  private tail: Tail;
  private lineSplitter: readline.Interface;
  public log: log.LogFunctions;

  constructor(file: string) {
    super();
    this.log = log.scope('scorebot');
    this.tail = new Tail(file, { encoding: 'utf8' });
    this.tail.on('tail_error', this.log.error);
    this.tail.on('error', this.log.error);
    this.tail.on('close', () => this.log.info('Shutdown.'));
  }

  /**
   * Handles incoming line stream data.
   *
   * @param line The line to parse.
   * @function
   */
  private onLine(line: string) {
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
      });
      return;
    }

    // player killed event
    regexmatch = line.match(RegexTypes.PLAYER_KILLED_REGEX);

    if (regexmatch) {
      const [, attackerSignature, victimSignature, weapon] = regexmatch;
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
        weapon,
      });
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
    try {
      this.log.info('Starting...');
      await this.tail.start();
      this.lineSplitter = readline.createInterface({ input: this.tail });
      this.lineSplitter.on('line', this.onLine.bind(this));
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
