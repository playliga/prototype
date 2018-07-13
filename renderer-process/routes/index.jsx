import React from 'react';
import { Route } from 'react-router-dom';
import Home from './home';

const Routes = () => (
  <section>
    <Route exact path="/" component={Home} />
  </section>
);

export default Routes;