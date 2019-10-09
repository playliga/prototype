import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Routes from 'renderer/windows/main/routes';


const App = () => (
  <MemoryRouter>
    <Routes />
  </MemoryRouter>
);

export default App;
