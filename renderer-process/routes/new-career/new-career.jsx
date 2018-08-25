// @flow
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { Route } from 'react-router-dom';

import { PlayerInformation, TeamInformation } from './routes';
import ContinentsContext from './continents-context';


// Temporary interface into models
let continents = [];

ipcRenderer.send( 'fetch-continents' );
ipcRenderer.on( 'receive-continents', ( event: Event, res: string ) => {
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
// NOTE: wierdness going on with state
// NOTE: re-renders multiple times is clearing out the previously
// NOTE: saved formsdata. so moved it to the file-level scope
const formsdata = [];

class NewCareer extends Component<{}, {}> {
  handleFinish = ( data: Object ) => {
    formsdata.push( data );
    console.log( formsdata );
  }

  render() {
    return (
      <ContinentsContext.Provider value={continents}>
        <Route
          exact
          path="/new-career"
          render={props => (
            <PlayerInformation
              {...props}
              onSubmit={data => formsdata.push( data )}
            />
          )}
        />
        <Route
          exact
          path="/new-career/team"
          render={props => (
            <TeamInformation
              {...props}
              onSubmit={this.handleFinish}
            />
          )}
        />
      </ContinentsContext.Provider>
    );
  }
}

export default NewCareer;