// @flow
import React from 'react';
import { render } from 'react-dom';

render(
  // $FlowDisable
  <div>{'Hello from React!'}</div>, // eslint-disable-line
  document.getElementById( 'root' )
);
