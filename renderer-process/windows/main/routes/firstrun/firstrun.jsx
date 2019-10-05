// @flow
import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Route, Switch } from 'react-router-dom';

import One from './one';
import Two from './two';
import Finish from './finish';

import './firstrun.scss';


type State = {
  continents: Array<Object>,
  formdata: Array<any>
};

type Props = {
  history: Object,
  location: Object
};


export const FormContext = React.createContext({});


export default class FirstRun extends Component<Props, State> {
  imgdata = 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg';

  state = {
    continents: [],
    formdata: []
  }

  componentDidMount() {
    ipcRenderer.send( '/database/find', { dsname: 'continents' });
    ipcRenderer.on( '/database/find', this.handleContinentsFetch );
  }

  handleContinentsFetch = ( evt: Object, continents: Array<Object> ) => {
    this.setState({ continents });
  }

  handleSubmit = ( data: Object, next: string = '' ) => {
    const { formdata } = this.state;
    formdata.push( data );

    // start the save process if we're done
    // collecting form data
    if( next === 'finish' ) {
      ipcRenderer.send( '/windows/main/firstrun/save', formdata );
    }

    this.props.history.push( `/firstrun/${next}` );
    this.setState({ formdata });
  }

  renderRoutes = () => (
    <FormContext.Provider
      value={{
        continents: this.state.continents,
        onSubmit: this.handleSubmit
      }}
    >
      <Route exact path="/firstrun" component={One} />
      <Route exact path="/firstrun/two" component={Two} />
      <Route exact path="/firstrun/finish" component={Finish} />
    </FormContext.Provider>
  )

  render() {
    return (
      <div id="firstrun">
        <img src={this.imgdata} alt="La Liga" />
        <TransitionGroup>
          <CSSTransition key={this.props.location.key} classNames="fade" timeout={300}>
            <Switch location={this.props.location}>
              {this.renderRoutes()}
            </Switch>
          </CSSTransition>
        </TransitionGroup>
      </div>
    );
  }
}