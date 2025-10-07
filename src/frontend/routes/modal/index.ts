/**
 * Provides the route components for
 * the Modal Browser Window.
 *
 * @module
 */
import Brackets from './brackets';
import Issues from './issues';
import MapPool from './map-pool';
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
  MapPool,
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
