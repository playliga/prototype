// @flow
import React from 'react';
import { render } from 'react-dom';
import { Router, hashHistory } from 'react-router';
import Routes from './routes';

import 'font-awesome/css/font-awesome.css'; // eslint-disable-line
import './index.scss';

render(
  <Router history={hashHistory} routes={Routes} />,
  document.getElementById( 'root' )
);
