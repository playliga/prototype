import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Route, Switch, RouteComponentProps } from 'react-router-dom';

import IpcService from 'renderer/lib/ipc-service';
import { FormContext } from '../common';
import One from './01_userinfo';
import Two from './02_teaminfo';
import Finish from './03_finish';


interface State {
  continents: any[];
  formdata: Array<unknown>;
}


export default class Routes extends Component<RouteComponentProps, State> {
  private imgdata = 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg';

  public state = {
    continents: [],
    formdata: []
  }

  public async componentDidMount() {
    const data = await IpcService.send( '/database/', {
      params: {
        model: 'Continent',
        method: 'findAll',
        args: {
          include: [ 'Countries' ],
          where: { id: [ 4, 5 ] }
        }
      }
    });
    this.setState({ continents: data });
  }

  private handleSubmit = ( data: never, next = '' ) => {
    const { formdata } = this.state;
    formdata.push( data );

    // start the save process if we're done
    // collecting form data
    if( next === 'finish' ) {
      ipcRenderer.send( '/screens/firstrun/save', formdata );
    }

    this.props.history.push( `/firstrun/${next}` );
    this.setState({ formdata });
  }

  private renderRoutes = () => (
    <FormContext.Provider
      value={{
        continents: this.state.continents,
        onSubmit: this.handleSubmit
      }}
    >
      <Route exact path="/" component={One} />
      <Route exact path="/firstrun/two" component={Two} />
      <Route exact path="/firstrun/finish" component={Finish} />
    </FormContext.Provider>
  )

  public render() {
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
