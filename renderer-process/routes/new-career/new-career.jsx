// @flow
import React, { Fragment } from 'react';
import { Route } from 'react-router-dom';

import {
  PlayerInformation,
  TeamInformation,
  SquadInformation
} from './routes';


/**
 * This route will have nested routes which represent the
 * three forms:
 *
 * - User information
 * - Team information
 * - Starting V (technically 4 because user is included)
 */
const NewCareer = () => (
  <Fragment>
    <Route exact path="/new-career" component={SquadInformation} />
    <Route exact path="/new-career/team" component={TeamInformation} />
    <Route exact path="/new-career/squad" component={SquadInformation} />
  </Fragment>
);

export default NewCareer;