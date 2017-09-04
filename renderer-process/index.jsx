import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import 'font-awesome/css/font-awesome.css'; // eslint-disable-line
import './index.scss';

const App = () => (
  <h1>{'Back to da basics'}</h1>
);

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
  module.hot.accept( './', () => { render( App ); });
}
