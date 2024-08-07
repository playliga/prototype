/**
 * Provides the route components for the Landing Browser Window.
 *
 * @module
 */
import Create from './create';
import Connect from './connect';
import Home from './home';
import Load from './load';

/**
 * Exports this module.
 *
 * @exports
 */
export default {
  // standalone routes
  Connect,
  Home,

  // composite routes
  Create,
  Load,
};
