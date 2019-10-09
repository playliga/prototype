import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Particles from 'react-particles-js';

import './index.scss';
import App from './app';
import particleConfig from './assets/particle-config.json';


const render = ( Component: React.ReactType<unknown> ) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById( 'root' )
  );
};


const Wrapper = () => (
  <Fragment>
    <Particles
      params={particleConfig}
      className="particles"
    />
    <App />
  </Fragment>
);


render( Wrapper );


if( module.hot ) {
  module.hot.accept( './app', () => { render( Wrapper ); });
}
