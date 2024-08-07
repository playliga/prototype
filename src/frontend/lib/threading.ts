/**
 * A web worker module for CPU-intensive tasks.
 *
 * @module
 */
import fs from 'fs';
import { Constants } from '@liga/shared';

/**
 * Threading message bus signature.
 *
 * @type {ThreadRequest}
 */
export type ThreadRequest<T = unknown> = {
  target: (typeof Constants.ThreadingTarget)[keyof typeof Constants.ThreadingTarget];
  payload?: T;
};

/**
 * Threading response signature.
 *
 * @type {ThreadResponse}
 */
export interface ThreadResponse<T = unknown> extends ThreadRequest<T> {
  performance?: PerformanceEntry;
  status: (typeof Constants.ThreadingStatus)[keyof typeof Constants.ThreadingStatus];
}

/**
 * Calculates fibonacci numbers.
 *
 * A good way to test multithreading through web workers.
 *
 * @function
 * @param request Request body.
 */
function fibonacci(request: ThreadRequest<{ num: number }>) {
  let a = 1;
  let b = 0;

  self.performance.mark('start');

  while (request.payload.num >= 0) {
    [a, b] = [a + b, a];
    request.payload.num--;
  }

  self.performance.mark('end');
  self.performance.measure('timing', 'start', 'end');

  const response: ThreadResponse = {
    ...request,
    status: Constants.ThreadingStatus.COMPLETED,
    performance: self.performance.getEntriesByName('timing').map((entry) => entry.toJSON())[0],
  };
  self.postMessage(response);
}

/**
 * Displays the current working directory listing.
 *
 * @function
 * @param request Request body.
 */
async function listing(request: ThreadRequest) {
  self.performance.mark('start');
  const ls = await fs.promises.readdir('.');
  self.performance.mark('end');
  self.performance.measure('timing', 'start', 'end');

  const response: ThreadResponse = {
    ...request,
    target: Constants.ThreadingTarget.LISTING,
    status: Constants.ThreadingStatus.COMPLETED,
    performance: self.performance.getEntriesByName('timing').map((entry) => entry.toJSON())[0],
    payload: ls,
  };
  self.postMessage(response);
}

/**
 * Mapping of functions that will run in their own thread.
 *
 * @constant
 */
const ThreadingFunctions: Record<string, (args: ThreadRequest) => void> = {
  fibonacci,
  listing,
};

/**
 * Thread creation message bus handler.
 *
 * @function
 * @param e Message.
 */
self.onmessage = async (e: MessageEvent<ThreadRequest>) => {
  // bail if not a supported function
  if (!(e.data.target in ThreadingFunctions)) {
    return self.postMessage({
      ...e.data,
      status: Constants.ThreadingStatus.FAILED,
    });
  }

  // let main thread know work has started
  self.postMessage({
    ...e.data,
    status: Constants.ThreadingStatus.RUNNING,
  });

  // call the function
  ThreadingFunctions[e.data.target](e.data);
};
