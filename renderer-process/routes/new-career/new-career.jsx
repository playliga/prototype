// @flow
import React from 'react';
import { ipcRenderer } from 'electron';
import { Route } from 'react-router-dom';

import { PlayerInformation, TeamInformation } from './routes';
import CountriesContext from './countries-context';

// Temporary interface into models
let countries = [];

ipcRenderer.send( 'fetch-countries' );
ipcRenderer.on( 'receive-countries', ( event, res ) => {
  countries = res;
});


/**
 * This route will have nested routes which represent the
 * three forms:
 *
 * - User information
 * - Team information
 * - Starting V (technically 4 because user is included)
 */
const NewCareer = () => (
  <CountriesContext.Provider value={countries}>
    <Route exact path="/new-career" component={PlayerInformation} />
    <Route exact path="/new-career/team" component={TeamInformation} />
  </CountriesContext.Provider>
);

export default NewCareer;