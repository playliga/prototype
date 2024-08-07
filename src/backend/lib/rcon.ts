/**
 * RCON client and management module.
 *
 * @module
 */
import events from 'node:events';
import net from 'node:net';
import dgram from 'node:dgram';
import log from 'electron-log';
import { Buffer } from 'node:buffer';
import { ping } from '@network-utils/tcp-ping';
import { Util } from '@liga/shared';

/** @interface */
interface ClientEvents {
  [EventIdentifier.AUTH]: (value?: unknown) => void;
  [EventIdentifier.CONNECT]: () => void;
  [EventIdentifier.END]: () => void;
  [EventIdentifier.ERROR]: (error: Error) => void;
  [EventIdentifier.RESPONSE]: (response: string) => void;
  [EventIdentifier.SERVER]: (server: string) => void;
}

/** @enum */
export enum EventIdentifier {
  AUTH = 'auth',
  CONNECT = 'connect',
  END = 'end',
  ERROR = 'error',
  RESPONSE = 'response',
  SERVER = 'server',
}

/** @enum */
enum PacketType {
  AUTH = 0x03,
  COMMAND = 0x02,
  RESPONSE_AUTH = 0x02,
  RESPONSE_VALUE = 0x00,
}

/** @constant */
const defaultOptions = {
  challenge: true,
  rconId: 0x0012d4a6,
  retryFrequency: 5000,
  retryMax: 15,
  tcp: true,
};

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
 * A forked typescript version of `node-rcon` that fixes a buffer
 * deprecation warning that exists in the original implementation.
 *
 * @class
 */
export class Client extends events.EventEmitter {
  private challengeToken: string | null;
  private hasAuthed: boolean;
  private host: string;
  private log: log.LogFunctions;
  private options: typeof defaultOptions;
  private outstandingData: Buffer | null;
  private password: string;
  private port: number;
  private rconId: number;
  private tcpSocket: net.Socket | null;
  private udpSocket: dgram.Socket | null;

  constructor(
    host: string,
    port: number,
    password: string,
    options: Partial<Client['options']> = defaultOptions,
  ) {
    super();

    // set up plain properties
    this.challengeToken = null;
    this.hasAuthed = false;
    this.log = log.scope('rcon');
    this.host = host;
    this.options = { ...defaultOptions, ...options };
    this.outstandingData = null;
    this.password = password;
    this.port = port;
    this.rconId = this.options.rconId;
    this.tcpSocket = null;
    this.udpSocket = null;

    // add logging to connection events
    this.on(EventIdentifier.AUTH, () => this.log.info('Connection established.'));
    this.on(EventIdentifier.END, () => this.log.info('Connection closed.'));
  }

  private sendSocket(buf: Buffer, cb: ((error: Error) => void) | null = null): void {
    if (this.tcpSocket) {
      this.tcpSocket.write(buf.toString('binary'), 'binary', cb);
    } else if (this.udpSocket) {
      this.udpSocket.send(buf, 0, buf.length, this.port, this.host, cb);
    }
  }

  private socketOnConnect(): void {
    this.emit(EventIdentifier.CONNECT);

    if (this.options.tcp) {
      this.send(this.password, PacketType.AUTH, null);
    } else if (this.options.challenge) {
      const str = 'challenge rcon\n';
      const sendBuf = Buffer.alloc(str.length + 4);
      sendBuf.writeInt32LE(-1, 0);
      sendBuf.write(str, 4);
      this.sendSocket(sendBuf);
    } else {
      const sendBuf = Buffer.alloc(5);
      sendBuf.writeInt32LE(-1, 0);
      sendBuf.writeUInt8(0, 4);
      this.sendSocket(sendBuf);

      this.hasAuthed = true;
      this.emit(EventIdentifier.AUTH);
    }
  }

  private socketOnEnd(): void {
    this.emit(EventIdentifier.END);
    this.hasAuthed = false;
  }

  private socketOnError(error: Error) {
    this.emit(EventIdentifier.ERROR, error);
  }

  private tcpSocketOnData(data: Buffer): void {
    if (this.outstandingData != null) {
      data = Buffer.concat([this.outstandingData, data], this.outstandingData.length + data.length);
      this.outstandingData = null;
    }

    while (data.length) {
      const len = data.readInt32LE(0);
      if (!len) return;

      const id = data.readInt32LE(4);
      const type = data.readInt32LE(8);

      if (len >= 10 && data.length >= len + 4) {
        if (id == this.rconId) {
          if (!this.hasAuthed && type == PacketType.RESPONSE_AUTH) {
            this.hasAuthed = true;
            this.emit(EventIdentifier.AUTH);
          } else if (type == PacketType.RESPONSE_VALUE) {
            let str = data.toString('utf8', 12, 12 + len - 10);

            if (str.charAt(str.length - 1) === '\n') {
              str = str.substring(0, str.length - 1);
            }

            this.emit(EventIdentifier.RESPONSE, str);
          }
        } else if (id == -1) {
          this.emit(EventIdentifier.ERROR, new Error('Authentication failed'));
        } else {
          let str = data.toString('utf8', 12, 12 + len - 10);

          if (str.charAt(str.length - 1) === '\n') {
            str = str.substring(0, str.length - 1);
          }

          this.emit(EventIdentifier.SERVER, str);
        }

        data = data.slice(12 + len - 8);
      } else {
        this.outstandingData = data;
        break;
      }
    }
  }

  private udpSocketOnData(data: Buffer): void {
    const a = data.readUInt32LE(0);
    if (a == 0xffffffff) {
      const str = data.toString('utf-8', 4);
      const tokens = str.split(' ');
      if (tokens.length == 3 && tokens[0] == 'challenge' && tokens[1] == 'rcon') {
        this.challengeToken = tokens[2].substr(0, tokens[2].length - 1).trim();
        this.hasAuthed = true;
        this.emit(EventIdentifier.AUTH);
      } else {
        this.emit(EventIdentifier.RESPONSE, str.substr(1, str.length - 2));
      }
    } else {
      this.emit(EventIdentifier.ERROR, new Error('Received malformed packet'));
    }
  }

  public connect(): void {
    if (this.options.tcp) {
      this.tcpSocket = net.createConnection(this.port, this.host);
      this.tcpSocket
        .on('data', this.tcpSocketOnData.bind(this))
        .on('connect', this.socketOnConnect.bind(this))
        .on('error', this.socketOnError.bind(this))
        .on('end', this.socketOnEnd.bind(this));
    } else {
      this.udpSocket = dgram.createSocket('udp4');
      this.udpSocket
        .on('message', this.udpSocketOnData.bind(this))
        .on('listening', this.socketOnConnect.bind(this))
        .on('error', this.socketOnError.bind(this))
        .on('close', this.socketOnEnd.bind(this));
      this.udpSocket.bind(0);
    }
  }

  public disconnect(): void {
    this.log.info('Connection closed.');
    if (this.tcpSocket) this.tcpSocket.end();
    if (this.udpSocket) this.udpSocket.close();
  }

  /**
   * Safely connects to the RCON server by first waiting for it
   * to be reachable via ping (if enabled) and then attempts
   * to connect on a loop until all retries are exhausted.
   *
   * @function
   */
  public async init() {
    // retry until attempts are exhausted
    for (let i = 1; i <= this.options.retryMax; i++) {
      this.log.info('Establishing connection (attempt #%d)...', i);
      await Util.sleep(this.options.retryFrequency);

      // first ensure the rcon server can be pinged
      if (this.options.tcp) {
        try {
          await ping({ address: this.host, port: this.port, attempts: 1 });
        } catch (error) {
          continue;
        }
      }

      // next ensure the connection can be established
      try {
        await new Promise((resolve, reject) => {
          this.on(EventIdentifier.AUTH, resolve);
          this.on(EventIdentifier.ERROR, reject);
          this.connect();
        });
        return Promise.resolve();
      } catch (error) {
        continue;
      }
    }

    // if we got this far, we couldn't connect, give up
    return Promise.reject('Could not connect to RCON server.');
  }

  public send(data: string, cmd?: PacketType, id?: number, useAsync = true): Promise<void> | void {
    let sendBuf: Buffer;
    if (this.options.tcp) {
      cmd = cmd || PacketType.COMMAND;
      id = id || this.rconId;

      const length = Buffer.byteLength(data);
      sendBuf = Buffer.alloc(length + 14);
      sendBuf.writeInt32LE(length + 10, 0);
      sendBuf.writeInt32LE(id, 4);
      sendBuf.writeInt32LE(cmd, 8);
      sendBuf.write(data, 12);
      sendBuf.writeInt16LE(0, length + 12);
    } else {
      if (this.options.challenge && !this.challengeToken) {
        this.emit(EventIdentifier.ERROR, new Error('Not authenticated'));
        return;
      }
      let str = 'rcon ';
      if (this.challengeToken) str += this.challengeToken + ' ';
      if (this.password) str += this.password + ' ';
      str += data + '\n';
      sendBuf = Buffer.alloc(4 + Buffer.byteLength(str));
      sendBuf.writeInt32LE(-1, 0);
      sendBuf.write(str, 4);
    }

    if (useAsync) {
      return new Promise<void>((resolve) => {
        this.sendSocket(sendBuf, () => resolve());
      });
    } else {
      this.sendSocket(sendBuf);
    }
  }
}
