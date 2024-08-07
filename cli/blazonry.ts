/**
 * Team crests and blazonry generator using DrawShield API.
 *
 * @module
 */
import path from 'node:path';
import fs from 'node:fs';
import log from 'electron-log';
import { pipeline } from 'node:stream/promises';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'node:stream';
import { glob } from 'glob';
import { Command } from 'commander';
import { Util } from '@liga/shared';

/**
 * The default output directory if none is provided.
 *
 * @constant
 */
const DEFAULT_OUTPUT_PATH = path.join(__dirname, 'blazonry');

/**
 * Exclude list to prune out the ugliest Blazons.
 *
 * @constant
 */
const DEFAULT_EXCLUDE_LIST = [
  '009407.png',
  '009409.png',
  '009412.png',
  '009419.png',
  '009428.png',
  '009432.png',
  '009433.png',
  '009437.png',
  '009441.png',
  '009446.png',
  '009448.png',
  '009451.png',
  '009452.png',
  '009454.png',
  '009456.png',
  '009460.png',
  '009508.png',
  '009533.png',
];

/**
 * Scrapes image listings from a web directory index.
 *
 * @function
 * @param url The url to scrape.
 */
async function getImagesFromWebIndex(url: string) {
  const htmlResp = await fetch(url);
  const htmlText = await htmlResp.text();

  if (htmlResp.status !== 200) {
    // @todo: bail
  }

  // scrape the html for images
  const regex = /<a .+>\s(gallery-.+\.png)<\/a>/g;
  return Promise.resolve(htmlText.matchAll(regex));
}

/**
 * Generate team crests and blazonry using DrawShield API.
 *
 * @function
 * @param args CLI args.
 */
async function blazonry(args: Record<string, string>) {
  // figure out the output path
  const outputPath = args.out || DEFAULT_OUTPUT_PATH;

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // get a listing of existing images
  const existing = await glob('*.png', {
    cwd: path.normalize(outputPath),
  });

  // download image listings from web index
  let currPage = args.page;
  let currBatchNum = 0;
  let totalNum = 0;

  while (totalNum < parseInt(args.num) && currBatchNum < parseInt(args.batchLimit)) {
    // @note: trailing slash is necessary
    const url = `${args.endpoint}/${currPage}/img/`;
    log.info('Downloading Web Index: %s', url);

    for (const image of await getImagesFromWebIndex(url)) {
      const imageName = image[1];
      const imageOut = path.join(outputPath, imageName.replace('gallery-', ''));
      const imageResp = await fetch(url + imageName);

      // skip if image already exists
      if (existing.includes(path.basename(imageOut))) {
        log.info('Skipped: %s already exists.', path.basename(imageOut));
        continue;
      }

      // skip if it's in the exclude list
      if (DEFAULT_EXCLUDE_LIST.includes(path.basename(imageOut))) {
        log.info('Excluded: %s', path.basename(imageOut));
        continue;
      }

      // download the image and add to existing file list
      await pipeline(
        Readable.fromWeb(imageResp.body as ReadableStream<Uint8Array>),
        fs.createWriteStream(imageOut),
      );
      await Util.sleep(parseInt(args.throttle));
      existing.push(path.basename(imageOut));

      log.info('Downloaded: %s', imageOut);
      totalNum += 1;

      if (totalNum >= parseInt(args.num)) {
        break;
      }
    }

    // decrement the page counter and prefix with leading zeroes
    currPage = `00${parseInt(currPage) - 1}`;

    // bump the current batch number
    // and sleep before continuing
    currBatchNum += 1;
    log.info('Total Items: %d', totalNum);
    await Util.sleep(parseInt(args.throttle));
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
      .command('blazonry')
      .description('Generate team crests and blazonry using DrawShield API.')
      .option('--batch-limit <limit>', 'How many iterations to attempt before giving up', String(2))
      .option('-e --endpoint <url>', 'DrawShield API Endpoint', 'https://drawshield.net/gallery')
      .option('-n --num <num>', 'The number of items to generate', String(10))
      .option('-o --out [path]', 'Path to output directory')
      .option('-p --page <num>', 'Page to count down from', '0095')
      .option('-t --throttle <ms>', 'Time in ms to wait between downloads', String(2000))
      .action(blazonry);
  },
};
