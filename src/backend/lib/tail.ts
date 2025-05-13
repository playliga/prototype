/**
 * NodeJS implementation of Unix `tail -f`.
 *
 * @see https://github.com/logdna/tail-file-node
 * @module
 */
import events from 'node:events';
import fs from 'node:fs';
import stream from 'node:stream';

/** @type {ReadStreamOpts} */
type ReadStreamOpts = Exclude<Parameters<typeof fs.createReadStream>[1], string | undefined>;

/** @interface */
interface EventPayload {
  message: string;
  filename: string;
  when: Date;
}

/** @interface */
interface RetryEventPayload extends EventPayload {
  attempts: number;
}

/** @interface */
interface FlushEventPayload {
  lastReadPosition: number;
}

/** @interface */
interface TailErrorEventPayload {
  message: string;
  code: 'ETAIL';
  meta: {
    [key: string]: unknown;
    actual: Error;
  };
}

/** @enum */
export enum EventIdentifier {
  CLOSE = 'close',
  DATA = 'data',
  END = 'end',
  ERROR = 'error',
  PAUSE = 'pause',
  READABLE = 'readable',
  RESUME = 'resume',
  FLUSH = 'flush',
  RENAMED = 'renamed',
  RETRY = 'retry',
  TAIL_ERROR = 'tail-error',
  TRUNCATED = 'truncated',
}

/** @interface */
interface TailFileOptions extends stream.ReadableOptions {
  pollFileIntervalMs?: number;
  pollFailureRetryMs?: number;
  maxPollFailures?: number;
  readStreamOpts?: ReadStreamOpts;
  startPos?: number | null;
}

/** @interface */
interface WatcherEvents {
  [EventIdentifier.CLOSE]: () => void;
  [EventIdentifier.DATA]: (chunk: unknown) => void;
  [EventIdentifier.END]: () => void;
  [EventIdentifier.ERROR]: (err: Error) => void;
  [EventIdentifier.PAUSE]: () => void;
  [EventIdentifier.READABLE]: () => void;
  [EventIdentifier.RESUME]: () => void;
  [EventIdentifier.FLUSH]: (payload: FlushEventPayload) => void;
  [EventIdentifier.RENAMED]: (payload: EventPayload) => void;
  [EventIdentifier.RETRY]: (payload: RetryEventPayload) => void;
  [EventIdentifier.TAIL_ERROR]: (payload: TailErrorEventPayload) => void;
  [EventIdentifier.TRUNCATED]: (payload: EventPayload) => void;
}

/** @class */
export class WatcherError extends TypeError {
  code: string;
  meta: unknown;
}

/** @class */
export class Watcher extends stream.Readable {
  private kOpts: TailFileOptions;
  private kFileName: string;
  private kPollFileIntervalMs: number;
  private kPollFailureRetryMs: number;
  private kMaxPollFailures: number;
  private kPollFailureCount: number;
  private kStartPos: number | null;
  private kStream: fs.ReadStream | null;
  private kFileHandle: fs.promises.FileHandle | null;
  private kPollTimer: NodeJS.Timeout | null;
  private kQuitting: boolean;
  private kInode: number | null;

  override on<U extends keyof WatcherEvents>(event: U, listener: WatcherEvents[U]): this {
    return super.on(event, listener);
  }
  override emit<U extends keyof WatcherEvents>(event: U, ...args: Parameters<WatcherEvents[U]>) {
    return super.emit(event, ...args);
  }
  override _read(): void {}

  /**
   * Instantiating `TailFile` will return a readable stream, but nothing will
   * happen until `start()` is called. After that, follow node's standard
   * procedure to get the stream into flowing mode. Typically, this means
   * using `pipe` or attaching `data` listeners to the readable stream.
   *
   * @param filename The filename to tail. Poll errors do not happen until `start` is called.
   * @param opts    Optional options.
   * @constructor
   */
  constructor(filename: string, opts?: TailFileOptions) {
    const {
      pollFileIntervalMs,
      pollFailureRetryMs,
      maxPollFailures,
      readStreamOpts,
      startPos,
      ...superOpts
    } = opts;

    if (typeof filename !== 'string' || !filename.length) {
      const err = new WatcherError('filename must be a non-empty string');
      err.code = 'EFILENAME';
      throw err;
    }

    if (pollFileIntervalMs && typeof pollFileIntervalMs !== 'number') {
      const err = new WatcherError('pollFileIntervalMs must be a number');
      err.code = 'EPOLLINTERVAL';
      err.meta = {
        got: pollFileIntervalMs,
      };
      throw err;
    }

    if (pollFailureRetryMs && typeof pollFailureRetryMs !== 'number') {
      const err = new WatcherError('pollFailureRetryMs must be a number');
      err.code = 'EPOLLRETRY';
      err.meta = {
        got: pollFailureRetryMs,
      };
      throw err;
    }

    if (maxPollFailures && typeof maxPollFailures !== 'number') {
      const err = new WatcherError('maxPollFailures must be a number');
      err.code = 'EMAXPOLLFAIL';
      err.meta = {
        got: maxPollFailures,
      };
      throw err;
    }

    if (readStreamOpts && typeof readStreamOpts !== 'object') {
      const err = new WatcherError('readStreamOpts must be an object');
      err.code = 'EREADSTREAMOPTS';
      err.meta = {
        got: typeof readStreamOpts,
      };
      throw err;
    }

    if (startPos !== null && startPos !== undefined) {
      if (typeof startPos !== 'number') {
        const err = new WatcherError('startPos must be an integer >= 0');
        err.code = 'ESTARTPOS';
        err.meta = {
          got: typeof startPos,
        };
        throw err;
      }

      if (startPos < 0 || !Number.isInteger(startPos)) {
        const err = new WatcherError('startPos must be an integer >= 0');
        err.code = 'ESTARTPOS';
        err.meta = {
          got: startPos,
        };
        throw err;
      }
    }

    super(superOpts);

    this.kOpts = opts;
    this.kFileName = filename;
    this.kPollFileIntervalMs = pollFileIntervalMs || 1000;
    this.kPollFailureRetryMs = pollFailureRetryMs || 200;
    this.kMaxPollFailures = maxPollFailures || 10;
    this.kPollFailureCount = 0;
    this.kStartPos = startPos >= 0 ? startPos : null;
    this.kStream = null;
    this.kFileHandle = null;
    this.kPollTimer = null;
    this.kQuitting = false;
    this.kInode = null;
  }

  private async openFile() {
    this.kFileHandle = await fs.promises.open(this.kFileName, 'r');
  }

  private async pollFileForChanges() {
    try {
      const stats = await fs.promises.stat(this.kFileName);

      this.kPollFailureCount = 0; // reset
      const eof = stats.size;
      let fileHasChanged = false;

      if (!this.kInode) {
        this.kInode = stats.ino;
      }

      if (this.kStartPos === null) {
        // First iteration - nothing has been polled yet
        this.kStartPos = eof;
      } else if (this.kInode !== stats.ino) {
        // File renamed/rolled between polls without triggering `ENOENT`.
        // Conditional since this *may* have already been done if `ENOENT` threw earlier.
        if (this.kFileHandle) {
          try {
            await this.readRemainderFromFileHandle();
          } catch (error) {
            const err = new WatcherError('Could not read remaining bytes from old FH');
            err.meta = {
              error: error.message,
              code: error.code,
            };
            this.emit(EventIdentifier.TAIL_ERROR, err as TailErrorEventPayload);
          }
        }
        await this.openFile();
        this.kStartPos = 0;
        this.kInode = stats.ino;
        fileHasChanged = true;
        this.emit(EventIdentifier.RENAMED, {
          message: 'The file was renamed or rolled.  Tailing resumed from the beginning.',
          filename: this.kFileName,
          when: new Date(),
        });
      } else if (eof < this.kStartPos) {
        // Same file, but smaller/truncated
        this.kStartPos = 0;
        this.kInode = stats.ino;
        fileHasChanged = true;
        this.emit(EventIdentifier.TRUNCATED, {
          message: 'The file was truncated.  Tailing resumed from the beginning.',
          filename: this.kFileName,
          when: new Date(),
        });
      } else if (this.kStartPos !== eof) {
        fileHasChanged = true;
      }

      if (fileHasChanged) {
        await this.streamFileChanges();
        // Pause polling if backpressure is on
        if (this.kStream) {
          return;
        }
      } else {
        setImmediate(this.emit.bind(this), EventIdentifier.FLUSH, {
          lastReadPosition: this.kStartPos,
        });
      }

      this.scheduleTimer(this.kPollFileIntervalMs);
    } catch (err) {
      if (err.code === 'ENOENT') {
        if (this.kFileHandle) {
          // The .stat() via polling may have happened during a file rename/roll.
          // Don't lose the last lines in the file if it previously existed.
          // Perhaps it has not been re-created yet (or won't be)
          try {
            await this.readRemainderFromFileHandle();
          } catch (error) {
            this.emit(EventIdentifier.TAIL_ERROR, error);
          }
        }
        this.kPollFailureCount++;
        if (this.kPollFailureCount >= this.kMaxPollFailures) {
          return this.quit(err);
        }
        this.emit(EventIdentifier.RETRY, {
          message: 'File disappeared. Retrying.',
          filename: this.kFileName,
          attempts: this.kPollFailureCount,
          when: new Date(),
        });
        this.scheduleTimer(this.kPollFailureRetryMs);
        return;
      }

      // Some other error like EACCES
      // @todo: Retries for certain error codes can be put here
      this.quit(err);
    }
  }

  private async readChunks(stream: fs.ReadStream) {
    const iterator = stream.iterator ? stream.iterator({ destroyOnReturn: false }) : stream;

    for await (const chunk of iterator) {
      this.kStartPos += chunk.length;
      if (!this.push(chunk)) {
        this.kStream = stream;
        this.kPollTimer = null;
        return;
      }
    }

    // Chunks read successfully (no backpressure)
    if (this.kStream) {
      // Backpressure had been on, and polling was paused.  Resume here.
      this.scheduleTimer(this.kPollFileIntervalMs);
    }

    this.kStream = null;
    setImmediate(this.emit.bind(this), EventIdentifier.FLUSH, {
      lastReadPosition: this.kStartPos,
    });
  }

  private async readRemainderFromFileHandle() {
    // Read the end of a renamed file before re-opening the new file.
    // Use the file handle since it remains open even if the file name has changed
    const fileHandleTemp = this.kFileHandle; // Prevent races when closing
    this.kFileHandle = null;
    const stats = await fileHandleTemp.stat();
    const lengthToEnd = stats.size - this.kStartPos;
    const { buffer } = await fileHandleTemp.read(
      Buffer.alloc(lengthToEnd),
      0,
      lengthToEnd,
      this.kStartPos,
    );
    this.push(buffer);
    await fileHandleTemp.close();
  }

  private scheduleTimer(ms: number) {
    clearTimeout(this.kPollTimer);
    if (this.kQuitting) {
      return;
    }
    this.kPollTimer = setTimeout(this.pollFileForChanges.bind(this), ms);
  }

  private async streamFileChanges() {
    try {
      const stream = fs.createReadStream(this.kFileName, {
        ...this.kOpts.readStreamOpts,
        start: this.kStartPos,
      });
      stream.setMaxListeners(100); // Allow for additional listeners when reading backpressured chunks
      await this.readChunks(stream);
    } catch (err) {
      // Possible file removal.  Let auto-retry handle it.
      this.kPollFailureCount++;
      const error = new WatcherError('An error was encountered while tailing the file');
      error.code = 'ETAIL';
      error.meta = { actual: err };
      // Emitting on 'error' would bork the parent Readstream
      this.emit(EventIdentifier.TAIL_ERROR, error as TailErrorEventPayload);
    }
  }

  /**
   * Begins the polling of `filename` to watch for added/changed bytes.
   *
   * It may be called before or after data is set up to be consumed with a
   * `data` listener or a `pipe`. Standard node stream rules apply, which
   * say that data will not flow through the stream until it's consumed.
   *
   * @function
   */
  public async start() {
    await this.openFile();
    await this.pollFileForChanges();
  }

  /**
   * Closes all streams and exits cleanly. The parent `TailFile` stream will
   * be properly ended by pushing null, therefore an end event may be emitted
   * as well.
   *
   * @param err Optional error to pass along when quitting.
   * @function
   */
  public async quit(err?: Error) {
    this.kQuitting = true;
    clearTimeout(this.kPollTimer);

    if (err) {
      this.emit(EventIdentifier.ERROR, err);
    } else {
      // One last read to get lines added in high throughput
      this.pollFileForChanges().catch((): void => null);
      await events.once(this, EventIdentifier.FLUSH);
    }

    // Signal the end of this Readstream
    this.push(null);

    // Clean open file handles and streams
    if (this.kFileHandle) {
      this.kFileHandle.close().catch((): void => null);
    }

    if (this.kStream) {
      this.kStream.destroy();
    }

    // process.nextTick(() => {
    //   if (this.readableState && !this.readableState.endEmitted) {
    //     // 'end' is not emitted unless data is flowing, but this makes
    //     // confusing inconsistencies, so emit it all the time
    //     this.emit(EventIdentifier.END);
    //   }
    // });

    process.nextTick(() => {
      if (this.readable && !this.readableEnded) {
        // 'end' is not emitted unless data is flowing, but this makes
        // confusing inconsistencies, so emit it all the time
        this.emit(EventIdentifier.END);
      }
    });
  }
}
