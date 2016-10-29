// Babel assumes that the polyfill will be loaded before anything else.
// The babel team's recommendation is to make two files:
// See: http://stackoverflow.com/a/36628148

/* eslint-disable import/no-extraneous-dependencies */
import 'babel-polyfill';
import SquadUpdater from './squad-updater';

SquadUpdater.init();
