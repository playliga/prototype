/**
 * Shared application react hooks.
 *
 * @module
 */
import React from 'react';
import { Constants, Util } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';

/**
 * Exports other hooks.
 *
 * @exports
 */
export * from './use-translation';
export * from './use-audio';

/**
 * Theme provider simply modifies the root container's `data-theme`
 * field dynamically when a theme setting change is detected.
 *
 * @function
 * @exports
 */
export function useTheme() {
  const { state } = React.useContext(AppStateContext);
  const container = React.useMemo(() => document.querySelector('html'), []);

  // load user settings
  const settings = React.useMemo(
    () => state?.profile?.settings && Util.loadSettings(state.profile.settings),
    [state.profile],
  );

  // convert theme type to a valid daisy ui theme setting
  const theme = React.useMemo(
    () =>
      settings?.general?.theme &&
      Constants.ThemeSetting[
        settings.general.theme.toUpperCase() as keyof typeof Constants.ThemeSetting
      ],
    [settings?.general?.theme],
  );

  if (container && settings?.general?.theme) {
    switch (settings.general.theme) {
      case Constants.ThemeType.SYSTEM:
        container.dataset.theme = null;
        break;
      default:
        container.dataset.theme = theme;
        break;
    }
  }
}
