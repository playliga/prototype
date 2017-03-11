// @flow
import React from 'react';
import { render } from 'react-dom';
import { Router, hashHistory } from 'react-router';
import Routes from './routes';

import './index.scss';

render(
  <Router history={hashHistory} routes={Routes} />,
  document.getElementById( 'root' )
);
