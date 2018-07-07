// @flow
/* eslint-disable no-console */

import path from 'path';
import { ScraperFactory } from './';

export default async function run() {
  const factoryObj = new ScraperFactory( path.join( __dirname, 'cache' ), 'esea-csgo' );
  await factoryObj.generate();
}