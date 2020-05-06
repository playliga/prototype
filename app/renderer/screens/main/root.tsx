import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import Routes from 'renderer/screens/main/routes';


const Root = () => (
  <MemoryRouter>
    <Route path="/" component={Routes} />
  </MemoryRouter>
);

export default Root;
