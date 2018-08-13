import { ipcRenderer } from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import 'font-awesome/css/font-awesome.css';
import './index.scss';

import App from './app';

// Temporary interface into models
ipcRenderer.send( 'fetch-countries' );
ipcRenderer.on( 'receive-countries', ( event, countries ) => (
  console.log( countries )
) );

const render = ( Component ) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById( 'root' )
  );
};

render( App );

if( module.hot ) {
  module.hot.accept( './app', () => { render( App ); });
}
