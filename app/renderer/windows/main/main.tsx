import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Routes from 'renderer/windows/main/routes';


const Main = () => (
  <MemoryRouter>
    <Routes />
  </MemoryRouter>
);

export default Main;
