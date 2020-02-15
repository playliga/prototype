import React, { Fragment } from 'react';
import { Route } from 'react-router-dom';
import Home from './home';


const Routes = () => (
  <Fragment>
    <Route path="/" component={Home} />
  </Fragment>
);

export default Routes;
