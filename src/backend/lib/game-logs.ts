/**
 * Parses raw log streams from a Counter-Strike server.
 *
 * GoldSrc and Source engines send the logs over udp.
 *
 * Source2 sends the logs over HTTP.
 *
 * @module
 */
import dgram from 'node:dgram';
import events from 'node:events';
import http from 'node:http';
import log from 'electron-log';

/** @enum */
export enum EventIdentifier {
  CLOSE = 'close',
  ERROR = 'error',
  MESSAGE = 'message',
}

/** @interface */
interface ClientEvents {
  [EventIdentifier.CLOSE]: () => void;
  [EventIdentifier.ERROR]: (error: Error) => void;
  [EventIdentifier.MESSAGE]: (message: string) => void;
}

/** @constant */
const defaultOptions = {
  port: 27017,
  timeout: 30_000,
  udp: true,
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

/** @class */
export class Client extends events.EventEmitter {
  private host: string;
  private opts: typeof defaultOptions;
  private socket?: dgram.Socket;
  private server?: http.Server;

  public log: log.LogFunctions;

  constructor(host: string, opts: Partial<Client['opts']> = defaultOptions) {
    super();
    this.host = host;
    this.log = log.scope('game-logs');
    this.opts = { ...defaultOptions, ...opts };
  }

  private socketOnClose() {
    this.emit(EventIdentifier.CLOSE);
  }

  private socketOnError(error: Error) {
    this.emit(EventIdentifier.ERROR, error);
  }

  private socketOnMessage(data: Buffer) {
    const message = data.toString('utf8', 4);
    this.emit(EventIdentifier.MESSAGE, message);
  }

  public connect() {
    this.log.info('Establishing connection to %s:%d...', this.host, this.opts.port);

    if (!this.opts.udp) {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject('Timed out connecting to server.'),
          this.opts.timeout,
        );

        this.server = http.createServer((req, res) => {
          let body = '';

          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            res.writeHead(200, { 'content-type': 'text/plain' });
            res.end('ok');

            const lines = body
              .split(/\r?\n/)
              .map((line) => line.trimEnd())
              .filter((line) => line.length > 0);

            for (const line of lines) {
              this.emit(EventIdentifier.MESSAGE, line);
            }

            clearTimeout(timeout);
            resolve();
          });
          req.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });

        this.server.listen(this.opts.port, () => {
          this.log.debug('HTTP server listening on %s:%d...', this.host, this.opts.port);
        });
      });
    }

    this.socket = dgram.createSocket('udp4');
    this.socket.on('close', this.socketOnClose.bind(this));
    this.socket.on('error', this.socketOnError.bind(this));
    this.socket.on('message', this.socketOnMessage.bind(this));

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject('Timed out connecting to server.'),
        this.opts.timeout,
      );
      this.socket.once('message', () => {
        this.log.info('Connection established.');
        clearTimeout(timeout);
        resolve();
      });
      this.socket.once('error', reject);
      this.socket.bind(this.opts.port, this.host);
    });
  }

  public disconnect() {
    this.server?.close();
    this.socket?.close();
  }
}
