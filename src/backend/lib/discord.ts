/**
 * Discord RPC server client.
 *
 * @module
 */
import events from 'node:events';
import net from 'node:net';
import os from 'node:os';
import crypto from 'node:crypto';
import log from 'electron-log';
import { Buffer } from 'node:buffer';
import { app } from 'electron';
import { is } from '@liga/shared';

/** @enum */
export enum EventIdentifier {
  CLOSE = 'close',
  CONNECT = 'connect',
  ERROR = 'error',
  HANDSHAKE = 'handshake',
}

/** @enum */
enum PacketHeader {
  OPCODE = 0,
  PAYLOAD_LENGTH = 4,
  PAYLOAD = 8,
}

/** @enum */
enum PacketType {
  HANDSHAKE = 0,
  FRAME = 1,
  CLOSE = 2,
}

/** @enum */
enum PayloadCommandType {
  DISPATCH = 'DISPATCH',
  SET_ACTIVITY = 'SET_ACTIVITY',
}

/** @enum */
enum PayloadEventType {
  ERROR = 'ERROR',
  READY = 'READY',
}

/** @interface */
interface ClientEvents {
  [EventIdentifier.CLOSE]: (message: string) => void;
  [EventIdentifier.CONNECT]: () => void;
  [EventIdentifier.ERROR]: (error: Error) => void;
  [EventIdentifier.HANDSHAKE]: (message: string) => void;
}

/** @interface */
interface Payload {
  cmd: PayloadCommandType;
  nonce?: string;
}

/** @interface */
interface PayloadResponse<T = unknown> extends Payload {
  evt: PayloadEventType;
  data: T;
}

/** @interface */
interface PayloadRequest<T = unknown> extends Payload {
  args: T;
}

/** @interface */
interface PayloadDataError {
  code: number;
  message: string;
}

/** @interface */
interface PayloadRequestSetActivity {
  pid: number;
  activity?: DiscordActivity;
}

/**
 * Discord rate-limit in milliseconds.
 *
 * @constant
 */
export const RATE_LIMIT_MS = 15_000;

/**
 * Adds types to the event emitter the
 * {Client} class is extending.
 *
 * @interface
 */
export interface Client {
  on<U extends keyof ClientEvents>(event: U, listener: ClientEvents[U]): this;
  emit<U extends keyof ClientEvents>(event: U, ...args: Parameters<ClientEvents[U]>): boolean;
}

/**
 * The client class supports only one instance
 * at a time when connecting to discord.
 *
 * @class
 */
export class Client extends events.EventEmitter {
  /**
   * Holds the reference to the singleton instance.
   *
   * @constant
   */
  private static instance: Client;

  /**
   * The discord application client id.
   *
   * @constant
   */
  private clientId: string;

  /**
   * Tracks which requests are in-flight.
   *
   * @constant
   */
  private nonces = new Map();

  /**
   * TCP socket for the streaming IPC endpoint.
   *
   * @constant
   */
  private socket: net.Socket | null;

  /**
   * Marks when the first activity started.
   *
   * @constant
   */
  private startedAt: number;

  /**
   * Marks when the most recent activity started.
   *
   * @constant
   */
  private updatedAt: number;

  /**
   * Scoped electron-log instance.
   *
   * @constant
   */
  public log: log.LogFunctions;

  /** @constructor */
  constructor() {
    super();
    this.clientId = process.env.DISCORD_CLIENT_ID;
    this.socket = null;
    this.startedAt = Date.now();
    this.updatedAt = 0;
    this.log = log.scope('discord');
  }

  /**
   * Static getter method to instantiate
   * the singleton instance.
   *
   * @function
   */
  public static get Instance() {
    if (!Client.instance) {
      Client.instance = new this();
    }

    return Client.instance;
  }

  private getIPCPath() {
    if (is.osx()) {
      return process.env['NODE_ENV'] === 'cli'
        ? os.tmpdir() + '/discord-ipc-0'
        : app.getPath('temp') + '/discord-ipc-0';
    }

    return '\\\\?\\pipe\\discord-ipc-0';
  }

  private request<T = unknown>(payload: PayloadRequest) {
    if (!this.socket || this.socket.closed) {
      throw new Error('The socket has been closed.');
    }

    const elapsed = Date.now() - this.updatedAt;

    if (elapsed < RATE_LIMIT_MS) {
      throw new Error(
        `Not enough time has elapsed since last update: ${Math.floor(elapsed / 1000)}s`,
      );
    } else {
      this.updatedAt = this.updatedAt + elapsed;
    }

    return new Promise<T>((resolve, reject) => {
      payload.nonce = crypto.randomUUID();
      this.nonces.set(payload.nonce, { resolve, reject });
      this.socketSend(PacketType.FRAME, JSON.stringify(payload));
    });
  }

  private socketOnClose(): void {
    this.emit(EventIdentifier.CLOSE, 'Connection closed.');
    this.nonces.forEach((item) => item.reject(new Error('Connection closed.')));
    this.nonces.clear();
  }

  private socketOnConnect(): void {
    this.emit(EventIdentifier.CONNECT);
    this.log.debug('Sending handshake...');
    this.socketSend(
      PacketType.HANDSHAKE,
      JSON.stringify({
        v: 1,
        client_id: this.clientId,
      }),
    );
  }

  private socketOnData(data: Buffer): void {
    const opcode = data.readInt32LE(PacketHeader.OPCODE);
    const length = data.readInt32LE(PacketHeader.PAYLOAD_LENGTH);
    const payloadRaw = JSON.parse(
      data.toString('utf-8', PacketHeader.PAYLOAD, PacketHeader.PAYLOAD + length),
    );

    this.log.silly('Received Opcode: %s', opcode);
    this.log.silly('Received Payload: %o', payloadRaw);

    switch (opcode) {
      case PacketType.CLOSE:
        if ('code' in payloadRaw && 'message' in payloadRaw) {
          const payload = payloadRaw as PayloadDataError;
          this.emit(EventIdentifier.ERROR, new Error(payload.message));
        }
        break;
      case PacketType.FRAME: {
        const payload = payloadRaw as PayloadResponse;

        if (payload.cmd === PayloadCommandType.DISPATCH && payload.evt === PayloadEventType.READY) {
          this.emit(EventIdentifier.HANDSHAKE, 'Handshake successful.');
          break;
        }

        if (this.nonces.has(payload.nonce)) {
          const { resolve, reject } = this.nonces.get(payload.nonce);

          if (payload.evt === PayloadEventType.ERROR) {
            reject(payload.data);
          } else {
            resolve(payload.data);
          }

          this.nonces.delete(payload.nonce);
        }

        break;
      }
      default:
        break;
    }
  }

  private socketOnError(error: Error) {
    this.emit(EventIdentifier.ERROR, error);
  }

  private socketSend(opcode: PacketType, data: string): void {
    // discord rpc server format:
    //
    // [Opcode (4 bytes)] [JSON Payload Length (4 bytes)] [JSON Payload]
    const payloadBuf = Buffer.from(data, 'utf-8');
    const sendBuf = Buffer.alloc(PacketHeader.PAYLOAD + payloadBuf.length);

    sendBuf.writeInt32LE(opcode, PacketHeader.OPCODE);
    sendBuf.writeInt32LE(payloadBuf.length, PacketHeader.PAYLOAD_LENGTH);
    sendBuf.write(data, PacketHeader.PAYLOAD);

    this.socket.write(sendBuf);
  }

  public clearActivity() {
    const payload: PayloadRequest<PayloadRequestSetActivity> = {
      cmd: PayloadCommandType.SET_ACTIVITY,
      args: {
        pid: process.pid,
      },
    };
    return this.request(payload);
  }

  public async connect() {
    this.log.debug('Establishing connection to %s...', this.getIPCPath());

    // we let the error bubble up and _always_ clean up the
    // one-shot listeners used for the connection attempts
    let cleanup: () => void;

    try {
      await new Promise((resolve, reject) => {
        const onClose = (message: string) => reject(message);
        const onError = (error: Error) => reject(error);
        const onHandshake = (message: string) => resolve(message);

        cleanup = () => {
          this.off(EventIdentifier.CLOSE, onClose);
          this.off(EventIdentifier.ERROR, onError);
          this.off(EventIdentifier.HANDSHAKE, onHandshake);
        };

        this.once(EventIdentifier.CLOSE, onClose);
        this.once(EventIdentifier.ERROR, onError);
        this.once(EventIdentifier.HANDSHAKE, onHandshake);

        this.socket = net.createConnection({ path: this.getIPCPath() });
        this.socket
          .on('close', this.socketOnClose.bind(this))
          .on('connect', this.socketOnConnect.bind(this))
          .on('data', this.socketOnData.bind(this))
          .on('error', this.socketOnError.bind(this));
      });
    } finally {
      cleanup();
    }
  }

  public disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.end();
    this.socket = null;
  }

  public setActivity(data: DiscordActivity) {
    const payload: PayloadRequest<PayloadRequestSetActivity> = {
      cmd: PayloadCommandType.SET_ACTIVITY,
      args: {
        pid: process.pid,
        activity: {
          ...data,
          timestamps: {
            start: this.startedAt,
          },
        },
      },
    };
    return this.request<DiscordActivity>(payload);
  }
}
