/**
 * Get's the user's preferred locale from their settings.
 *
 * English is used as the fallback language if the specified
 * locale is not found in the translation JSON files.
 *
 * @module
 */
import Locale from '@liga/locale';
import { app } from 'electron';
import { Prisma } from '@prisma/client';
import { Constants, Util } from '@liga/shared';

/**
 * Exports this module.
 *
 * @param profile The active user profile.
 * @function
 */
export default function (profile: Prisma.ProfileGetPayload<unknown>) {
  // if user locale not valid we'll fallback
  // to using their system's locale
  const settings = Util.loadSettings(profile?.settings || '{}');
  const userLocale = settings.general.locale as Constants.LocaleIdentifier;

  if (userLocale in Locale) {
    return Locale[settings.general.locale as Constants.LocaleIdentifier];
  }

  // convert bcp47 language codes to iso639 format
  //
  // e.g.: `en-US` becomes just `en`
  const locale = app.getLocale().split('-')[0];
  return Locale[locale as Constants.LocaleIdentifier] || Locale.en;
}
