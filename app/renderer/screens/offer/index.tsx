import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'flagpack/dist/flagpack.css';
import './assets/styles.scss';
import Offer from './offer';


const render = ( Component: React.ReactType<unknown> ) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById( 'root' )
  );
};


render( Offer );


if( module.hot ) {
  module.hot.accept( './offer', () => { render( Offer ); });
}
