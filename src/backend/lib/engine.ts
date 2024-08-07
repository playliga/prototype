/**
 * The engine loop module runs middleware on a loop.
 *
 * The `onTickStart` middleware is required since it collects the
 * input data to pass on to other middleware during a tick.
 *
 * Unlike the `onTick` middleware, the `generic` middleware is only executed if
 * the current tick's input data contains its registered unique identifier.
 *
 * The `onLoopFinish` middleware is only executed once at the end of the final loop.
 *
 * # Usage
 *
 * ```js
 * # passes <some_data> to subsequent middleware
 * Runtime.Instance.register('onTickSTart', () => Runtime.Instance.setInput(<some_data>))
 *
 * # can use <some_data> in its callback
 * Runtime.Instance.register('<some_identifier>', <some_callback>);
 * Runtime.Instance.register('onTick', <some_callback>);
 * ```
 *
 * @module
 */
import log from 'electron-log';
import { flatten } from 'lodash';

/** @enum */
export enum LoopStatus {
  RUNNING = 0,
  TERMINATED = 1,
}

/** @enum */
export enum MiddlewareType {
  LOOP_FINISH = 'onLoopFinish',
  TICK = 'onTick',
  TICK_END = 'onTickEnd',
  TICK_START = 'onTickStart',
}

/** @interface */
export interface MiddlewareCallback {
  (data?: unknown, status?: LoopStatus): Promise<unknown>;
}

/** @interface */
export interface Middleware {
  type: MiddlewareType | string;
  callback: MiddlewareCallback;
}

/**
 * The runtime class supports only one instance at a time so middleware
 * can be registered from anywhere in the application.
 *
 * @class
 */
export class Runtime {
  /**
   * Holds the reference to the singleton instance.
   *
   * @constant
   */
  private static instance: Runtime;

  /**
   * The main loop interval reference.
   *
   * @constant
   */
  private loop: NodeJS.Timer;

  /**
   * Contains the registered middleware.
   *
   * @constant
   */
  private middleware = {
    [MiddlewareType.LOOP_FINISH]: [] as Middleware[],
    [MiddlewareType.TICK]: [] as Middleware[],
    [MiddlewareType.TICK_END]: [] as Middleware[],
    [MiddlewareType.TICK_START]: [] as Middleware[],
    generic: [] as Middleware[],
  };

  /**
   * The input data for each tick.
   *
   * @constant
   */
  public input: Array<{ type: string } & unknown>;

  /**
   * Scoped electron-log instance.
   *
   * @constant
   */
  public log: log.LogFunctions;

  /**
   * Static getter method to instantiate
   * the singleton instance.
   *
   * @function
   */
  public static get Instance() {
    if (!Runtime.instance) {
      Runtime.instance = new this();
      Runtime.instance.log = log.scope('engine');
    }

    return Runtime.instance;
  }

  /**
   * Registers engine middleware.
   *
   * @param type The middleware type.
   * @param callback The middleware callback.
   * @function
   */
  public register(type: Middleware['type'], callback: MiddlewareCallback) {
    if (type in this.middleware) {
      this.middleware[type as MiddlewareType].push({ type, callback });
    } else {
      this.middleware.generic.push({ type, callback });
    }
  }

  /**
   * Executes generic middleware which is only executed
   * if the current tick's input data contains
   * its registered unique identifier.
   *
   * @param item The tick item.
   * @function
   */
  private async runGenericMiddleware(item: (typeof this.input)[number]) {
    const middleware = this.middleware.generic.filter((m) => m.type === item.type);
    return Promise.all(middleware.map((m) => m.callback(item)));
  }

  /**
   * Starts the engine loop.
   *
   * @param max               The maximum ticks to iterate through.
   * @param ignoreTermSignal  If set to true, will ignore any exit requests from middleware.
   * @function
   */
  public async start(max: number, ignoreTermSignal = false) {
    // bail if no init middleware was registered
    const [onTickStart] = this.middleware.onTickStart;
    const [onLoopFinish] = this.middleware.onLoopFinish;

    if (!onTickStart) {
      throw new Error(`'${MiddlewareType.TICK_START}' middleware has not been registered!`);
    }

    // clear previous performance marks and measures
    performance.clearMarks();
    performance.clearMeasures();

    // run the loop
    for (let tick = 0; tick < max; tick++) {
      // start benchmarking
      const perfMarkname = String(tick);
      performance.mark(perfMarkname);

      // the `onTickStart` middleware will refresh
      // the data object on every tick
      await onTickStart.callback();

      // the `generic` and `onTick` middleware
      const results = [
        ...(await Promise.all(this.input.map(this.runGenericMiddleware.bind(this)))),
        ...(await Promise.all(this.middleware.onTick.map((m) => m.callback(this.input)))),
      ];

      // check if any middleware returned falsy
      const terminate = !ignoreTermSignal && flatten(results).findIndex((r) => r === false) > -1;

      // run the end tick middleware and bump our tick count
      if (this.middleware.onTickEnd) {
        performance.measure(perfMarkname, perfMarkname);
        await Promise.all(
          this.middleware.onTickEnd.map((item) =>
            item.callback(this.input, terminate ? LoopStatus.TERMINATED : LoopStatus.RUNNING),
          ),
        );
      }

      // run end-loop middleware if we've reached our max iterations
      // or any middleware sent a termination signal
      if (tick >= max - 1 || terminate) {
        // output benchmark timings
        const entries = performance.getEntriesByType('measure');
        const total = entries.map((entry) => entry.duration).reduce((a, b) => a + b);
        const avg = total / entries.length;
        this.log.info('Total Loops: %d', tick + 1);
        this.log.info('Total Loop Time: %dms', Math.floor(total));
        this.log.info('Average Loop Time: %dms', Math.floor(avg));

        // run end-loop middleware, if any, then bail
        await (onLoopFinish?.callback(this.input) || Promise.resolve());
        break;
      }
    }

    return Promise.resolve();
  }
}
