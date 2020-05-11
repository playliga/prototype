import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import Routes from 'renderer/screens/main/routes';
import configureRedux from 'renderer/screens/main/redux';


/**
 * THE ROOT CONTAINER
 *
 * Holds any components that do not need to
 * ever be re-rendered.
 */

const Root = () => (
  <MemoryRouter>
    <Provider store={configureRedux()}>
      <Route path="/" component={Routes} />
    </Provider>
  </MemoryRouter>
);

export default Root;
