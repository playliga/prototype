import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import Routes from 'renderer/windows/firstrun/routes';


const Main = () => (
  <MemoryRouter>
    <Route path="/" component={Routes} />
  </MemoryRouter>
);

export default Main;
