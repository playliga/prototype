// @flow
import React from 'react';
import { Route, IndexRoute } from 'react-router';

const Home = ( props: Object ) => (
  <div>{'Hey! Hi from react-router!'}</div>
);

export default (
  <Route path="/">
    <IndexRoute component={Home} />
  </Route>
);
