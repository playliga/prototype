import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import './assets/styles.scss';
import Main from './main';


const render = ( Component: React.ReactType<unknown> ) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById( 'root' )
  );
};


render( Main );


if( module.hot ) {
  module.hot.accept( './main', () => { render( Main ); });
}
