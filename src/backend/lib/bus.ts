/**
 * Event bus for messaging between modules
 * within the main Electron process.
 *
 * @module
 */
import events from 'node:events';
import { Prisma } from '@prisma/client';
import { Eagers } from '@liga/shared';

/**
 * Message identifiers.
 *
 * @enum
 */
export enum MessageIdentifier {
  MATCH_COMPLETED = 'MATCH_COMPLETED',
  MATCH_UPDATE_MAP_LIST = 'MATCH_UPDATE_MAP_LIST',
  SEASON_START = 'SEASON_START',
  SQUAD_RELEASE_PLAYER = 'SQUAD_RELEASE_PLAYER',
  TRAINING_COMPLETED = 'TRAINING_COMPLETED',
  TOURNEY_COMPLETED = 'TOURNEY_COMPLETED',
  TRANSFER_COMPLETED = 'TRANSFER_COMPLETED',
}

/**
 * Event bus payloads.
 *
 * @interface
 */
interface Events {
  [MessageIdentifier.MATCH_COMPLETED]: () => void;
  [MessageIdentifier.SEASON_START]: () => void;
  [MessageIdentifier.SQUAD_RELEASE_PLAYER]: () => void;
  [MessageIdentifier.TOURNEY_COMPLETED]: (
    competition: Prisma.CompetitionGetPayload<typeof Eagers.competitionAlt>,
  ) => void;
  [MessageIdentifier.TRAINING_COMPLETED]: () => void;
  [MessageIdentifier.TRANSFER_COMPLETED]: (
    transfer: Prisma.TransferGetPayload<typeof Eagers.transfer>,
  ) => void;
}

/**
 * Event bus signal singleton class.
 *
 * @class
 */
export class Signal extends events.EventEmitter {
  /**
   * Holds the reference to the singleton instance.
   *
   * @constant
   */
  private static instance: Signal;

  /**
   * Private constructor to enforce singleton.
   *
   * @constructor
   */
  private constructor() {
    super();
  }

  /**
   * Static getter method to instantiate
   * the singleton instance.
   *
   * @function
   */
  public static get Instance() {
    if (!Signal.instance) {
      Signal.instance = new this();
    }

    return Signal.instance;
  }

  /**
   * Strongly-typed event bus listener.
   *
   * @param event     The event identifier.
   * @param listener  The callback function.
   * @function
   */
  on<U extends keyof Events>(event: U, listener: Events[U]) {
    return super.on(event, listener);
  }

  /**
   * Strongly-typed event bus emitter.
   *
   * @param event The event identifier.
   * @param args  The emitter arguments.
   * @function
   */
  emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>) {
    return super.emit(event, ...args);
  }
}
