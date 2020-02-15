import React, { Fragment } from 'react';
import { Route } from 'react-router-dom';
import FirstRun from './firstrun';


const Routes = () => (
  <Fragment>
    <Route path="/" component={FirstRun} />
  </Fragment>
);

export default Routes;
