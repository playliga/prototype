import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'flagpack/dist/flagpack.css';
import './assets/styles.scss';
import Root from './root';


const render = ( Component: React.ReactType<unknown> ) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById( 'root' )
  );
};


render( Root );


if( module.hot ) {
  module.hot.accept( './root', () => { render( Root ); });
}
