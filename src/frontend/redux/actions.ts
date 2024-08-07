/**
 * Configures the state actions.
 *
 * @module
 */
import { AppState } from './state';

/** @enum */
export enum ReduxActions {
  APP_INFO_UPDATE,
  APP_STATUS_UPDATE,
  CONTINENTS_UPDATE,
  EMAILS_UPDATE,
  EMAILS_DELETE,
  PROFILE_UPDATE,
  PROFILES_DELETE,
  PROFILES_UPDATE,
  WINDOW_DATA_UPDATE,
}

/**
 * @param payload The redux payload.
 * @function
 */
export function appInfoUpdate(payload: AppState['appInfo']) {
  return {
    type: ReduxActions.APP_INFO_UPDATE,
    payload,
  };
}

/**
 * @param payload The redux payload.
 * @function
 */
export function appStatusUpdate(payload: AppState['appStatus']) {
  return {
    type: ReduxActions.APP_STATUS_UPDATE,
    payload,
  };
}

/**
 * @param payload The redux payload.
 * @function
 */
export function continentsUpdate(payload: AppState['continents']) {
  return {
    type: ReduxActions.CONTINENTS_UPDATE,
    payload,
  };
}

/**
 * @param payload The redux payload.
 * @function
 */
export function emailsUpdate(payload: AppState['emails']) {
  return {
    type: ReduxActions.EMAILS_UPDATE,
    payload,
  };
}

/**
 * @param payload The redux payload.
 * @function
 */
export function emailsDelete(payload: AppState['emails']) {
  return {
    type: ReduxActions.EMAILS_DELETE,
    payload,
  };
}

/**
 * @param payload The redux payload.
 * @function
 */
export function profileUpdate(payload: AppState['profile']) {
  return {
    type: ReduxActions.PROFILE_UPDATE,
    payload,
  };
}

/**
 * @param payload The redux payload.
 * @function
 */
export function profilesDelete(payload: AppState['profiles']) {
  return {
    type: ReduxActions.PROFILES_DELETE,
    payload,
  };
}

/**
 * @param payload The redux payload.
 * @function
 */
export function profilesUpdate(payload: AppState['profiles']) {
  return {
    type: ReduxActions.PROFILES_UPDATE,
    payload,
  };
}

/**
 * @param payload The redux payload.
 * @function
 */
export function windowDataUpdate(payload: AppState['windowData']) {
  return {
    type: ReduxActions.WINDOW_DATA_UPDATE,
    payload,
  };
}
