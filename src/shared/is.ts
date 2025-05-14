/**
 * Determines the current environment (prod vs dev) from
 * within the context of the Electron runtime.
 *
 * @see https://github.com/delvedor/electron-is
 * @module
 */

/**
 * Checks whether in dev environment.
 *
 * @function
 */
export function dev() {
  const { env, execPath, defaultApp } = process;
  const isEnvSet = 'ELECTRON_IS_DEV' in env;
  const getFromEnv = Number.parseInt(env.ELECTRON_IS_DEV, 10) === 1;
  const electronContext =
    (typeof defaultApp === 'boolean' && defaultApp === true) ||
    /[\\/]electron(?:\.exe)?$/.test(execPath);

  return isEnvSet ? getFromEnv : electronContext;
}

/** @constant */
export const main = () => process.type === 'browser';

/** @constant */
export const osx = () => process.platform === 'darwin';

/** @constant */
export const production = () => !dev();
