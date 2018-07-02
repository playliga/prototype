// @flow

/* eslint-disable no-console */
import path from 'path';
import Factory from './factory';

export default async function init() {
  const factoryObj = new Factory( path.join( __dirname, 'cache' ) );
  await factoryObj.generate();
}
