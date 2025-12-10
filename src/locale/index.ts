/**
 * Provides translated strings.
 *
 * @module
 */
import * as TemplatesDe from './de/templates';
import * as TemplatesEn from './en/templates';
import * as TemplatesEs from './es/templates';
import * as TemplatesFr from './fr/templates';
import * as TemplatesIt from './it/templates';
import * as TemplatesPt from './pt/templates';
import TranslationsDe from './de/translations.json';
import TranslationsEn from './en/translations.json';
import TranslationsEs from './es/translations.json';
import TranslationsFr from './fr/translations.json';
import TranslationsIt from './it/translations.json';
import TranslationsPt from './pt/translations.json';
import { Constants } from '@liga/shared';

/**
 * Exports this module.
 *
 * @exports
 */
export default {
  [Constants.LocaleIdentifier.DE]: {
    templates: TemplatesDe,
    translations: TranslationsDe,
  },
  [Constants.LocaleIdentifier.EN]: {
    templates: TemplatesEn,
    translations: TranslationsEn,
  },
  [Constants.LocaleIdentifier.ES]: {
    templates: TemplatesEs,
    translations: TranslationsEs,
  },
  [Constants.LocaleIdentifier.FR]: {
    templates: TemplatesFr,
    translations: TranslationsFr,
  },
  [Constants.LocaleIdentifier.IT]: {
    templates: TemplatesIt,
    translations: TranslationsIt,
  },
  [Constants.LocaleIdentifier.PT]: {
    templates: TemplatesPt,
    translations: TranslationsPt,
  },
};
