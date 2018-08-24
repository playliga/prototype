// @flow
import React from 'react';
import { ipcRenderer } from 'electron';
import { Route } from 'react-router-dom';

import { PlayerInformation, TeamInformation } from './routes';
import ContinentsContext from './continents-context';

// Temporary interface into models
let continents = [];

ipcRenderer.send( 'fetch-continents' );
ipcRenderer.on( 'receive-continents', ( event, res ) => {
  continents = JSON.parse( res );
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
  <ContinentsContext.Provider value={continents}>
    <Route
      exact
      path="/new-career"
      render={props => (
        <PlayerInformation
          {...props}
          onSubmit={data => console.log( data )}
        />
      )}
    />
    <Route
      exact
      path="/new-career/team"
      render={props => (
        <TeamInformation
          {...props}
          onSubmit={data => console.log( data )}
        />
      )}
    />
  </ContinentsContext.Provider>
);

export default NewCareer;