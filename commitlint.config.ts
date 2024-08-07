/**
 * `commitlint` leverages husky to create a git
 * hook that enforces conventional commits.
 *
 * @module
 */
import type { UserConfig } from '@commitlint/types';

/**
 * `commitlint` configuration object.
 *
 * @constant
 */
const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
};

/**
 * Exports this module.
 *
 * @exports
 */
export default Configuration;
