// @flow
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Route, Switch } from 'react-router-dom';

import One from './one';
import Two from './two';
import './firstrun.scss';


type State = {
  // @TODO
};

type Props = {
  history: Object,
  location: Object
};


class FirstRun extends Component<Props, State> {
  imgdata = 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg';

  state = {
    // @TODO
  }

  componentDidMount() {
    ipcRenderer.send( '/database/continents' );
    ipcRenderer.on( '/database/continents', this.handleContinentsFetch );
  }

  handleContinentsFetch = ( evt: Object, data: any ) => {
    console.log( data );
  }

  handleSubmit = ( evt: Object ) => {
    evt.preventDefault();
    this.props.history.push( '/?firstrun=false' );
  }

  render() {
    return (
      <div id="firstrun">
        <img src={this.imgdata} alt="La Liga" />

        <TransitionGroup>
          <CSSTransition key={this.props.location.key} classNames="fade" timeout={300}>
            <Switch location={this.props.location}>
              <Route exact path="/firstrun" component={One} />
              <Route exact path="/firstrun/two" component={Two} />
            </Switch>
          </CSSTransition>
        </TransitionGroup>
      </div>
    );
  }
}

export default FirstRun;