/**
 * Provides the route components for the Main Browser Window.
 *
 * @module
 */
import Competitions from './competitions';
import Dashboard from './dashboard';
import Inbox from './inbox';
import Players from './players';
import Squad from './squad';
import Teams from './teams';

/**
 * Exports this module.
 *
 * @exports
 */
export default {
  // standalone routes
  Dashboard,
  Inbox,
  Players,
  Squad,

  // composite routes
  Competitions,
  Teams,
};
