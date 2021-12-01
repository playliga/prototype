import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { Route, Switch, RouteComponentProps } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Steps } from 'antd';
import { UserOutlined, TeamOutlined, FileDoneOutlined } from '@ant-design/icons';

import * as IPCRouting from 'shared/ipc-routing';
import IpcService from 'renderer/lib/ipc-service';
import AppLogo from 'renderer/assets/logo.png';
import { FormContext } from '../common';
import One from './01_userinfo';
import Two from './02_teaminfo';
import Finish from './03_finish';


interface State {
  continents: any[];
  formdata: Array<unknown>;
}


export default class Routes extends Component<RouteComponentProps, State> {
  private routes = [
    { path: '/', component: One, title: 'Player', icon: <UserOutlined /> },
    { path: '/firstrun/two', component: Two, title: 'Team', icon: <TeamOutlined /> },
    { path: '/firstrun/finish', component: Finish, title: 'Finish', icon: <FileDoneOutlined /> },
  ];

  public state = {
    continents: [] as any[],
    formdata: [] as any[],
  }

  public async componentDidMount() {
    const data = await IpcService.send( IPCRouting.Database.GENERIC, {
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
      ipcRenderer.send( IPCRouting.FirstRun.SAVE, formdata );
    }

    this.props.history.push( `/firstrun/${next}` );
    this.setState({ formdata });
  }

  private renderRoutes = () => {
    return (
      <FormContext.Provider
        value={{
          continents: this.state.continents,
          onSubmit: this.handleSubmit
        }}
      >
        {this.routes.map( r => (
          <Route
            exact
            key={r.path}
            path={r.path}
            component={r.component}
          />
        ))}
      </FormContext.Provider>
    );
  }

  public render() {
    const { props, routes } = this;
    const active = routes.findIndex( r => r.path === props.location.pathname );

    return (
      <div id="firstrun">
        <img src={AppLogo} alt="LIGA Esports Manager" />

        <section id="steps">
          <Steps
            current={active}
            labelPlacement="vertical"
            size="small"
          >
            {routes.map( r => (
              <Steps.Step
                key={r.path}
                title={r.title}
                icon={r.icon}
              />
            ))}
          </Steps>
        </section>

        <section id="routes">
          <TransitionGroup>
            <CSSTransition key={props.location.key} classNames="fade" timeout={300}>
              <Switch location={props.location}>
                {this.renderRoutes()}
              </Switch>
            </CSSTransition>
          </TransitionGroup>
        </section>
      </div>
    );
  }
}
