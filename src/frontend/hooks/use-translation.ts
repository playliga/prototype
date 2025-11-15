/**
 * Translation and locale hooks.
 *
 * @module
 */
import React from 'react';
import { get } from 'lodash';
import { AppStateContext } from '@liga/frontend/redux';

/**
 * Used for building dot-notation key paths.
 *
 * @type {Join}
 */
type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;

/**
 * Recursively extracts all possible dot-notation
 * paths from a nested object.
 *
 * e.g.: `{ home: { create: "..." } }` becomes `home.create`.
 *
 * @type {DotKeys}
 */
type DotKeys<T> = {
  [K in keyof T & string]: T[K] extends object ? Join<K, DotKeys<T[K]>> : K;
}[keyof T & string];

/**
 * Represents the root `translations` object and is used
 * as the base for extracting contexts and keys.
 *
 * @type {Translations}
 */
type Translations = LocaleData['translations'];

/**
 * Top-level namespaces/contexts in the translation JSON.
 *
 * e.g.: `landing`, `settings`, `etc`.
 *
 * @type {TranslationContexts}
 */
type TranslationContexts = keyof Translations;

/**
 * All dot-notation translation keys.
 *
 * @type {AllTranslationKeys}
 */
type AllTranslationKeys = DotKeys<Translations>;

/**
 * Combines a given context with the `shared` namespace.
 *
 * This allows keys like `shared.name` to be
 * accessible alongside scoped keys.
 *
 * @type {WithShared}
 */
type WithShared<T extends object> = T & Translations['shared'] & Translations['achievements'];

/**
 * All valid dot-notation keys for a given scoped context.
 *
 * @type {ScopedWithSharedKeys}
 */
type ScopedWithSharedKeys<C extends TranslationContexts> = C extends keyof Translations
  ? DotKeys<WithShared<Translations[C]>>
  : never;

/**
 * Returns a scoped translation function limited to the given context.
 *
 * @param context The top-level translation context.
 * @overload
 */
export function useTranslation<C extends TranslationContexts>(
  context: C,
): (key: ScopedWithSharedKeys<C> | `shared.${DotKeys<Translations['shared']>}`) => string;

/**
 * Returns a global translation function that accepts full dot-notation keys.
 *
 * @overload
 */
export function useTranslation(): (key: AllTranslationKeys) => string;

/**
 * Internal implementation of the translation hook.
 *
 * If a context is provided, it will return a scoped translation
 * function that also includes the `shared` namespace.
 *
 * If no context is provided, it returns a global translation function
 * that accepts any valid dot-notation key across all namespaces.
 *
 * @param context The translation context.
 * @function
 */
export function useTranslation(context?: TranslationContexts) {
  const { state } = React.useContext(AppStateContext);
  const locale = state.locale.translations;
  const merged =
    context && context in locale
      ? {
          ...locale[context],
          shared: locale.shared,
        }
      : locale;
  return (path: string) => get(merged, path) ?? path;
}
