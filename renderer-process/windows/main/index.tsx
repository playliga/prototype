import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import './index.scss';
import App from './app';


const render = ( Component: React.ReactType<unknown> ) => {
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
