/**
 * Provides convenience wrappers and business
 * logic for common development tasks.
 *
 * # Usage
 *
 * ```bash
 * npm run cli
 * npm run cli -- stats --help
 * npm run cli -- scraper teams --token <...>
 * ```
 *
 * @module
 */
import AppInfo from 'package.json';
import blazonry from './blazonry';
import sandbox from './sandbox';
import scraper from './scraper';
import stats from './stats';
import { Command } from 'commander';

/** @constant */
const COMMAND_MAP: Record<
  string,
  typeof blazonry | typeof sandbox | typeof scraper | typeof stats
> = {
  blazonry,
  sandbox,
  scraper,
  stats,
};

/**
 * Initializes the CLI.
 *
 * @function
 * @name anonymous
 */
(async () => {
  // configure cli
  const program = new Command();
  program.name(AppInfo.name).description(AppInfo.description).version(AppInfo.version);

  // adjust node env
  process.env['NODE_ENV'] = 'cli';

  // register subcommands
  Object.keys(COMMAND_MAP)
    .map((commandName) => COMMAND_MAP[commandName])
    .forEach((command) => command.register(program));

  // run the cli
  await program.parseAsync(process.argv);
})();
