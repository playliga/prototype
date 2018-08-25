import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import Routes from 'splash-page/routes';

const App = () => (
  <MemoryRouter>
    <Routes />
  </MemoryRouter>
);

export default App;
