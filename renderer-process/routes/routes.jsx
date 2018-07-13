import React from 'react';
import { Route } from 'react-router-dom';

import Home from './home';
import NewCareer from './new-career';

const Routes = () => (
  <section>
    <Route exact path="/" component={Home} />
    <Route exact path="/new-career" component={NewCareer} />
  </section>
);

export default Routes;