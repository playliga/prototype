/**
 * Represents the structure of the translation
 * data imported from locale files.
 *
 * @type {LocaleData}
 */
declare type LocaleData =
  (typeof import('../locale').default)[keyof typeof import('../locale').default];
