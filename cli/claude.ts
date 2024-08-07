/**
 * Team blazonry and competition trophies
 * generator using Claude AI.
 *
 * @module
 */
import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import log from 'electron-log';
import { sample } from 'lodash';
import { Command } from 'commander';
import { Util } from '@liga/shared';

/** @interface */
interface APIMessageResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
  error?: {
    type: string;
    message: string;
  };
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  type: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/** @enum */
enum Prompt {
  BLAZONRY = 'blazonry',
  TROPHIES = 'trophies',
}

/**
 * Default configuration settings.
 *
 * @enum
 */
enum Settings {
  ENDPOINT = 'https://api.anthropic.com/v1/messages',
  MODEL = 'claude-3-5-sonnet-20241022',
  MODEL_MAX_TOKENS = 1000,
  MODEL_VERSION = '2023-06-01',
  NUM_ITEMS = 10,
  NUM_THROTTLE = 2000,
}

/**
 * The default output directory if none is provided.
 *
 * @constant
 */
const DEFAULT_OUTPUT_PATH = path.join(__dirname, 'generated');

/**
 * The prompt used to generate the team blazon.
 *
 * @constant
 */
const PROMPT_BLAZONRY = `
Generate a generic Esports team crest SVG.

Do not include any identifying texts as the crests should be able to be used for any team name.

Do not specify width and height in the svg properties.

Give me just the SVG content without code blocks or extra response text.
`;

/**
 * The prompt used to generate a competition trophy.
 *
 * @constant
 */
const PROMPT_TROPHIES = `
Generate a generic Esports trophy SVG. Make it the color %s.

Do not include any identifying texts as the trophy should be applicable to any tournament.

Do not specify width and height in the svg properties.

Give me just the SVG content without code blocks or extra response text.
`;

/**
 * A map of possible supported prompt types.
 *
 * @constant
 */
const PROMPTS = {
  [Prompt.BLAZONRY]: PROMPT_BLAZONRY,
  [Prompt.TROPHIES]: PROMPT_TROPHIES,
};

/**
 * Generic Claude AI REST API request handler.
 *
 * @param endpoint  The endpoint to call.
 * @param opts      The fetch options.
 * @function
 */
export async function request<T = unknown>(endpoint: string, opts: Partial<RequestInit>) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'anthropic-version': Settings.MODEL_VERSION.toString(),
      'content-type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      ...opts.headers,
    },
    ...opts,
  });
  return response.json() as T;
}

/**
 * Builds the ai prompt.
 *
 * @param promptType The type of prompt of run.
 * @function
 */
function buildPrompt(promptType: Prompt) {
  switch (promptType) {
    case Prompt.BLAZONRY:
      return PROMPTS[promptType];
    case Prompt.TROPHIES:
      return util.format(PROMPTS[promptType], sample(['gold', 'silver', 'bronze']));
  }
}

/**
 * Generate team blazonry and competition
 * trophies using Claude AI's API.
 *
 * @param promptType  The type of prompt of run.
 * @param args        CLI args.
 * @function
 */
async function claude(promptType: Prompt, args: Record<string, string>) {
  // figure out the output path
  const outputPath = args.out || path.join(DEFAULT_OUTPUT_PATH, promptType);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // generate blazons
  let total = 0;

  while (total < parseInt(args.num)) {
    const response = await request<APIMessageResponse>(args.endpoint, {
      body: JSON.stringify({
        max_tokens: Settings.MODEL_MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: buildPrompt(promptType),
              },
            ],
          },
        ],
        model: Settings.MODEL,
        system: 'You are an SVG graphic designer.',
      }),
    });

    // basic error handling
    if (response.type === 'error') {
      log.error(response.error);
      break;
    }

    const [data] = response.content;

    if (data.type !== 'text') {
      log.error('response data type not supported: %o', response.content);
    }

    // save the file to disk
    const fileName = path.join(outputPath, response.id + '.svg');

    try {
      await fs.promises.writeFile(fileName, data.text);
    } catch (error) {
      log.error(error);
      break;
    }

    // bail if we've reached out total count
    total += 1;
    log.info('Downloaded: %s', fileName);
    log.info('Total: %d', total);
    await Util.sleep(parseInt(args.throttle));

    if (total >= parseInt(args.num)) {
      break;
    }
  }
}

/**
 * Exports this module.
 *
 * @export
 */
export default {
  /**
   * Registers this module's CLI.
   *
   * @function
   * @param program CLI parser.
   */
  register: (program: Command) => {
    program
      .command('claude')
      .description('Generate team crests and blazonry using Claude AI.')
      .argument('[prompt]', 'The type of prompt to use', Prompt.BLAZONRY)
      .option('-e --endpoint <url>', 'Claude AI API Endpoint', Settings.ENDPOINT)
      .option('-n --num <num>', 'The number of items to generate', String(Settings.NUM_ITEMS))
      .option('-o --out [path]', 'Path to output directory')
      .option(
        '-t --throttle <ms>',
        'Time in ms to wait between requests',
        String(Settings.NUM_THROTTLE),
      )
      .action(claude);
  },
};
