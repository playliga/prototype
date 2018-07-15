// @flow
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import Home from './home';
import NewCareer from './new-career';

import './routes.scss';

const Routes = () => (
  <Route
    render={({ location }) => (
      <TransitionGroup>
        <CSSTransition key={location.key} classNames="fade" timeout={500}>
          <Switch location={location}>
            <Route exact path="/" component={Home} />
            <Route exact path="/new-career" component={NewCareer} />
          </Switch>
        </CSSTransition>
      </TransitionGroup>
    )}
  />
);

export default Routes;