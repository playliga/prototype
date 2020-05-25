import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Offer from './offer';
import './assets/styles.scss';


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
