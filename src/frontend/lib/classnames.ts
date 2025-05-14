/**
 * Simple util for conditionally joining `classNames` together.
 *
 * @see https://github.com/JedWatson/classnames
 * @module
 */

/** @type {Value} */
export type Value = string | boolean | undefined | null;

/** @type {Mapping} */
export type Mapping = Record<string, unknown>;

/** @type {ArgumentArray} */
export type ArgumentArray = Array<Argument>;

/** @type {ReadonlyArgumentArray} */
export type ReadonlyArgumentArray = ReadonlyArray<Argument>;

/** @type {Argument} */
export type Argument = Value | Mapping | ArgumentArray | ReadonlyArgumentArray;

/**
 * This can be removed once typescript config
 * is updated to target ES2022+.
 *
 * @constant
 */
const hasOwn = {}.hasOwnProperty;

/**
 * @param args The arguments.
 * @function
 */
export default function classNames(...args: ArgumentArray) {
  let classes = '';

  for (let i = 0; i < arguments.length; i++) {
    const arg = args[i];
    if (arg) {
      classes = appendClass(classes, parseValue(arg));
    }
  }

  return classes;
}

/**
 * @param arg The arguments.
 * @function
 */
function parseValue(arg: Argument) {
  if (typeof arg === 'string') {
    return arg;
  }

  if (typeof arg !== 'object') {
    return '';
  }

  if (Array.isArray(arg)) {
    return classNames(...arg);
  }

  if (
    arg.toString !== Object.prototype.toString &&
    !arg.toString.toString().includes('[native code]')
  ) {
    return arg.toString();
  }

  let classes = '';

  for (const key in arg) {
    if (hasOwn.call(arg, key) && (arg as Mapping)[key]) {
      classes = appendClass(classes, key);
    }
  }

  return classes;
}

/**
 * @param value     The value.
 * @param newClass  The class.
 * @function
 */
function appendClass(value: string, newClass: string) {
  if (!newClass) {
    return value;
  }

  return value ? value + ' ' + newClass : newClass;
}
