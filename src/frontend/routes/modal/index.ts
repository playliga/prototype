/**
 * Provides the route components for
 * the Modal Browser Window.
 *
 * @module
 */
import Brackets from './brackets';
import Issues from './issues';
import Markdown from './markdown';
import Play from './play';
import Postgame from './postgame';
import Settings from './settings';
import Transfer from './transfer';

/**
 * Exports this module.
 *
 * @exports
 */
export default {
  // standalone routes
  Brackets,
  Play,
  Postgame,
  Settings,
  Transfer,

  // composite routes
  Issues,
  Markdown,
};
