/**
 * Provides the route components for
 * the Modal Browser Window.
 *
 * @module
 */
import Brackets from './brackets';
import Issues from './issues';
import Markdown from './markdown';
import Mods from './mods';
import Play from './play';
import Postgame from './postgame';
import Pregame from './pregame';
import Settings from './settings';
import Team from './team';
import Transfer from './transfer';

/**
 * Exports this module.
 *
 * @exports
 */
export default {
  // standalone routes
  Brackets,
  Mods,
  Play,
  Postgame,
  Pregame,
  Settings,
  Transfer,

  // composite routes
  Issues,
  Markdown,
  Team,
};
