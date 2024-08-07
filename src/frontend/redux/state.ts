/**
 * Configures the application state.
 *
 * @module
 */
import type AppInfo from 'package.json';
import { Constants, Eagers } from '@liga/shared';

/** @interface */
export interface AppAction<T> {
  type: number;
  payload?: T;
}

/** @interface */
export interface AppState {
  appInfo: typeof AppInfo;
  appStatus: string;
  continents: Array<
    Awaited<ReturnType<typeof api.continents.all<typeof Eagers.continent>>>[number]
  >;
  emails: Awaited<ReturnType<typeof api.emails.all<typeof Eagers.email>>>;
  profile: Awaited<ReturnType<typeof api.profiles.current<typeof Eagers.profile>>>;
  profiles: Array<AppState['profile']>;
  windowData: Partial<{
    [Constants.WindowIdentifier.Landing]: Parameters<typeof api.profiles.create>[number];
  }>;
}

/** @type {AppActions} */
export type AppActions = AppAction<AppState[keyof AppState]>;

/** @type {AppDispatch} */
export type AppDispatch = React.Dispatch<AppActions>;

/** @constant */
export const InitialState: AppState = {
  appInfo: null,
  appStatus: null,
  continents: [],
  emails: [],
  profile: null,
  profiles: [],
  windowData: {
    landing: {
      today: new Date(
        new Date().getFullYear(),
        Constants.Application.SEASON_START_MONTH,
        Constants.Application.SEASON_START_DAY,
      ),
    },
  },
};
