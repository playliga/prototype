/**
 * TCP ping utility.
 *
 * @see https://github.com/justintaddei/tcp-ping
 * @module
 */
import { Socket } from 'node:net';

/**
 * Ping Options.
 *
 * @interface
 */
export interface PingOptions {
  address: string;
  port: number;
  attempts: number;
  timeout: number;
}

/**
 * The result of ping attempt that failed.
 *
 * @interface
 */
export interface PingError {
  attempt: number;
  error: Error;
}

/**
 * The results of a ping attempt.
 *
 * @interface
 */
export interface PingResult {
  options: PingOptions;
  averageLatency: number;
  minimumLatency: number;
  maximumLatency: number;
  errors: PingError[];
}

/**
 * The result of a connection attempt.
 *
 * @interface
 */
export interface ConnectionAttempt {
  attemptNumber: number;
  result: {
    time?: number;
    error?: Error;
  };
}

/**
 * Attempts to connect to the given host and returns the `ConnectionResult`
 *
 * @param options         The options to use for this connection.
 * @param options.address The IP address of the device being pinged.
 * @param options.port    The port to ping.
 * @param options.timeout The time whichafter each TCP socket will timeout.
 * @function
 */
function connect({ address, port, timeout }: PingOptions): Promise<ConnectionAttempt['result']> {
  return new Promise((resolve) => {
    // save the current time so we can calculate latency
    const startTime = process.hrtime();
    const socket = new Socket();

    // connect to the given host
    socket.connect(port, address, () => {
      // calculate the latency of the connection
      const [seconds, nanoseconds] = process.hrtime(startTime);

      // convert the latency from nanoseconds to milliseconds
      // so that the output is easier to work with
      const timeToConnect = (seconds * 1e9 + nanoseconds) / 1e6;
      socket.destroy();
      resolve({ time: timeToConnect });
    });

    // make sure we catch any errors thrown by the socket
    socket.on('error', (error) => {
      socket.destroy();
      resolve({ error });
    });

    // set the timeout for the connection
    socket.setTimeout(timeout, () => {
      socket.destroy();
      resolve({ error: Error('Request timeout') });
    });
  });
}

/**
 * Pings the given device and report the statistics
 * in the form of an `PingResult` object.
 *
 * @param options   The options to use for this connection.
 * @param progress  The progress.
 * @function
 */
export async function ping(
  options?: Partial<PingOptions>,
  progress?: (progress: number, total: number) => void,
): Promise<PingResult> {
  // default ping options
  const opts: PingOptions = {
    address: '127.0.0.1',
    attempts: 10,
    port: 80,
    timeout: 3000,
    ...options,
  };

  // validate the port
  if (opts.port < 1) throw RangeError('Negative port');

  // an array of all the connection attempts
  const connectionResults: ConnectionAttempt[] = [];

  // try to connect to the given host
  for (let i = 0; i < opts.attempts; i++) {
    connectionResults.push({
      // i + 1 so the first attempt is `attempt 1`
      // instead of `attempt 0`
      attemptNumber: i + 1,
      result: await connect(opts),
    });

    if (typeof progress === 'function') {
      progress(i + 1, opts.attempts);
    }
  }

  // the result of this ping
  const result: PingResult = {
    averageLatency: NaN,
    errors: [],
    maximumLatency: 0,
    minimumLatency: Infinity,
    options: opts,
  };

  // the sum of the latency of all
  // the successful ping attempts
  let latencySum = 0;

  // loop over all the connection results
  for (const attempt of connectionResults) {
    // if `time` is undefined then
    // assume there's an error
    if (typeof attempt.result.time === 'undefined') {
      // push the error onto the errors array
      result.errors.push({
        attempt: attempt.attemptNumber,
        // if error is undefined then throw an unknown error
        error: attempt.result.error || Error('Unknown error'),
      });
      // we're done with this iteration
      continue;
    }

    // get the latency of this attempt
    const { time } = attempt.result;

    // add it to the sum
    latencySum += time;

    // if this attempts latency is less
    // then the current `minimumLatency` then we
    // update `minimumLatency`
    if (time < result.minimumLatency) result.minimumLatency = time;

    // if this attempts latency is greater
    // then the current `maximumLatency` then we
    // update `maximumLatency`
    if (time > result.maximumLatency) result.maximumLatency = time;
  }

  // calculate the average latency of all the attempt
  //
  // excluding the attempts that errored because
  // those didn't return a latency
  result.averageLatency = latencySum / (connectionResults.length - result.errors.length);
  return result;
}

/**
 * Makes one attempt to reach the host and returns a `boolean`
 * indicating whether or not it was successful.
 *
 * @param port    The port to ping.
 * @param address The IP address of the device being pinged.
 * @param timeout The time whichafter each TCP socket will timeout.
 * @function
 */
export async function probe(port: number, address = '127.0.0.1', timeout = 3000): Promise<boolean> {
  // ping the host
  const result = await ping({ address, port, timeout, attempts: 1 });

  // if there aren't any error then the device is reachable
  return result.errors.length === 0;
}
