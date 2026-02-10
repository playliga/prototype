/**
 * Locale utility functions.
 *
 * @module
 */
import Locale from '@liga/locale';
import { app } from 'electron';
import { Prisma } from '@prisma/client';
import { Constants, Util } from '@liga/shared';

/**
 * Gets the system locale identifier.
 *
 * English is used as the fallback language identifier if the detected
 * locale from the system is not found in the locale enum.
 *
 * @function
 */
export function getLocaleIdentifier() {
  // convert bcp47 language codes to iso639 format
  //
  // e.g.: `en-US` becomes just `en`
  const locale = app.getLocale().split('-')[0] as Constants.LocaleIdentifier;

  if (!Object.values(Constants.LocaleIdentifier).includes(locale)) {
    return Constants.LocaleIdentifier.EN;
  }

  return locale;
}

/**
 * Get's the user's preferred locale from their settings.
 *
 * English is used as the fallback language if the specified
 * locale is not found in the translation JSON files.
 *
 * @param profile The active user profile.
 * @function
 */
export function getLocale(profile: Prisma.ProfileGetPayload<unknown>) {
  // if user locale not valid we'll fallback
  // to using their system's locale
  const settings = Util.loadSettings(profile?.settings || '{}');
  const userLocale = settings.general.locale as Constants.LocaleIdentifier;

  if (userLocale in Locale) {
    return Locale[settings.general.locale as Constants.LocaleIdentifier];
  }

  return Locale[getLocaleIdentifier()] || Locale.en;
}
