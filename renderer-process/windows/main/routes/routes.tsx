import React, { Fragment } from 'react';
import { Route, Redirect, RouteComponentProps } from 'react-router-dom';
import Home from './home';
import FirstRun from './firstrun';


const Routes = () => (
  <Fragment>
    {/*
      * The root route will redirect the user to
      * the `create team` form if it detects that this
      * is the first time the app is being run.
    */}
    <Route
      exact
      path="/"
      render={( props: RouteComponentProps ) => {
        const params = new URLSearchParams( props.location.search || window.location.search );
        const isFirstRun = params.get( 'firstrun' ) === 'true';

        return isFirstRun
          ? <Redirect to="/firstrun" />
          : <Redirect to="/home" />;
      }}
    />

    {/* ALL OTHER ROUTES */}
    <Route path="/firstrun" component={FirstRun} />
    <Route exact path="/home" component={Home} />
  </Fragment>
);

export default Routes;
