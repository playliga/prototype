/**
 * Provides the route components for the Main Browser Window.
 *
 * @module
 */
import Calendar from './calendar';
import Competitions from './competitions';
import Dashboard from './dashboard';
import Inbox from './inbox';
import Players from './players';
import Sponsors from './sponsors';
import Squad from './squad';
import Teams from './teams';

/**
 * Exports this module.
 *
 * @exports
 */
export default {
  // standalone routes
  Calendar,
  Dashboard,
  Inbox,
  Players,
  Squad,

  // composite routes
  Competitions,
  Sponsors,
  Teams,
};
