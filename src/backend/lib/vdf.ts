/**
 * Extracts and parses Valve's Key/Value file format.
 *
 * @see https://github.com/node-steam/vdf
 * @module
 */

/**
 * Parse a VDF string into a JSON object
 *
 * @param text VDF string to parse
 * @function
 */
export function parse(text: string) {
  if (typeof text !== 'string') {
    throw new TypeError('VDF | Parse: Expecting parameter to be a string');
  }

  const lines = text.split('\n');
  const object = {} as Record<string, unknown>;
  const stack = [object];
  let expect = false;

  const regex = new RegExp(
    '^("((?:\\\\.|[^\\\\"])+)"|([a-z0-9\\-\\_]+))' +
      '([ \t]*(' +
      '"((?:\\\\.|[^\\\\"])*)(")?' +
      '|([a-z0-9\\-\\_]+)' +
      '))?',
  );

  let i = 0;
  const j = lines.length;

  let comment = false;

  for (; i < j; i++) {
    let line = lines[i].trim();

    if (line.startsWith('/*') && line.endsWith('*/')) {
      continue;
    }

    if (line.startsWith('/*')) {
      comment = true;
      continue;
    }

    if (line.endsWith('*/')) {
      comment = false;
      continue;
    }

    if (comment) {
      continue;
    }

    if (line === '' || line[0] === '/') {
      continue;
    }
    if (line[0] === '{') {
      expect = false;
      continue;
    }
    if (expect) {
      throw new SyntaxError(`VDF | Parse: Invalid syntax on line ${i + 1}`);
    }
    if (line[0] === '}') {
      stack.pop();
      continue;
    }
    while (true) {
      const m = regex.exec(line);
      if (m === null) {
        throw new SyntaxError(`VDF | Parse: Invalid syntax on line ${i + 1}`);
      }
      const key = m[2] !== undefined ? m[2] : m[3];
      let val: unknown = m[6] !== undefined ? m[6] : m[8];

      if (val === undefined) {
        if (stack[stack.length - 1][key] === undefined) {
          stack[stack.length - 1][key] = {};
        }
        stack.push(stack[stack.length - 1][key] as (typeof stack)[number]);
        expect = true;
      } else {
        if (m[7] === undefined && m[8] === undefined) {
          line += '\n' + lines[++i];
          continue;
        }
        if (val !== '' && !isNaN(val as number)) {
          val = +val;
        }
        if (val === 'true') {
          val = true;
        }
        if (val === 'false') {
          val = false;
        }
        if (val === 'null') {
          val = null;
        }
        if (val === 'undefined') {
          val = undefined;
        }

        stack[stack.length - 1][key] = val;
      }
      break;
    }
  }

  if (stack.length !== 1) {
    throw new SyntaxError('VDF | Parse: Open parentheses somewhere');
  }

  return object;
}

/**
 * Parse a JSON object into a VDF string
 *
 * @param object JSON object to parse
 * @function
 */
export function stringify(object: Record<string, unknown>) {
  if (typeof object !== 'object') {
    throw new TypeError('VDF | Stringify: First input parameter is not an object');
  }

  return create(object);
}

/**
 * @param object  The object.
 * @param level   The level.
 * @function
 */
function create(object: Record<string, unknown>, level = 0) {
  if (typeof object !== 'object') {
    throw new TypeError('VDF | Stringify: A key has value of type other than string or object');
  }

  const x = '\t';
  let result = '';
  let indent = '';

  for (let i = 0; i < level; i++) {
    indent += x;
  }

  for (const key in object) {
    if (typeof object[key] === 'object' && object[key] !== null) {
      result += [
        indent,
        '"',
        key,
        '"\n',
        indent,
        '{\n',
        create(object[key] as Record<string, unknown>, level + 1),
        indent,
        '}\n',
      ].join('');
    } else {
      result += [indent, '"', key, '"', x, x, '"', String(object[key]), '"\n'].join('');
    }
  }

  return result;
}
