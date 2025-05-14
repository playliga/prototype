/**
 * Strips indentation from multi-line strings.
 *
 * @see https://github.com/dmnd/dedent
 * @module
 */

/** @interface */
export interface DedentOptions {
  escapeSpecialCharacters?: boolean;
  trimWhitespace?: boolean;
}
/** @interface */
export interface Dedent {
  (literals: string): string;
  (strings: TemplateStringsArray, ...values: unknown[]): string;
  withOptions: CreateDedent;
}

/** @type {CreateDedent} */
export type CreateDedent = (options: DedentOptions) => Dedent;

/**
 * @param options The dedent options.
 * @function
 */
function createDedent(options: DedentOptions) {
  dedent.withOptions = (newOptions: DedentOptions): Dedent =>
    createDedent({ ...options, ...newOptions });

  return dedent;

  /**
   * @param literals Template string literals.
   * @function
   */
  function dedent(literals: string): string;

  /**
   * @param strings The template strings array.
   * @param values  The values.
   * @function
   */
  function dedent(strings: TemplateStringsArray, ...values: unknown[]): string;

  /**
   * @param strings The template strings array.
   * @param values  The values.
   * @function
   */
  function dedent(strings: TemplateStringsArray | string, ...values: unknown[]) {
    const raw = typeof strings === 'string' ? [strings] : strings.raw;
    const { escapeSpecialCharacters = Array.isArray(strings), trimWhitespace = true } = options;

    // first, perform interpolation
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      let next = raw[i];

      if (escapeSpecialCharacters) {
        // handle escaped newlines, backticks, and interpolation characters
        next = next
          .replace(/\\\n[ \t]*/g, '')
          .replace(/\\`/g, '`')
          .replace(/\\\$/g, '$')
          .replace(/\\\{/g, '{');
      }

      result += next;

      if (i < values.length) {
        result += values[i];
      }
    }

    // now strip indentation
    const lines = result.split('\n');
    let mindent: null | number = null;
    for (const l of lines) {
      const m = l.match(/^(\s+)\S+/);
      if (m) {
        const indent = m[1].length;
        if (!mindent) {
          // this is the first indented line
          mindent = indent;
        } else {
          mindent = Math.min(mindent, indent);
        }
      }
    }

    if (mindent !== null) {
      const m = mindent; // appease TypeScript
      result = lines
        // https://github.com/typescript-eslint/typescript-eslint/issues/7140

        .map((l) => (l[0] === ' ' || l[0] === '\t' ? l.slice(m) : l))
        .join('\n');
    }

    // dedent eats leading and trailing whitespace too
    if (trimWhitespace) {
      result = result.trim();
    }

    // handle escaped newlines at the end to ensure they don't get stripped too
    if (escapeSpecialCharacters) {
      result = result.replace(/\\n/g, '\n');
    }

    return result;
  }
}

/** @constant */
export const dedent: Dedent = createDedent({});
