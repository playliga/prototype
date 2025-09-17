/**
 * Provides the route components for the Landing Browser Window.
 *
 * @module
 */
import Create from './create';
import Connect from './connect';
import Home from './home';
import Load from './load';
import Exhibition from './exhibition';

/**
 * Exports this module.
 *
 * @exports
 */
export default {
  // standalone routes
  Connect,
  Exhibition,
  Home,

  // composite routes
  Create,
  Load,
};
