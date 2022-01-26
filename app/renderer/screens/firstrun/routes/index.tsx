import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { Route, Switch, RouteComponentProps } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { Avatar, Steps } from 'antd';
import { UserOutlined, TeamOutlined, FileDoneOutlined, LoadingOutlined } from '@ant-design/icons';

import * as IPCRouting from 'shared/ipc-routing';
import IpcService from 'renderer/lib/ipc-service';
import { FormContext } from '../common';
import One from './01_userinfo';
import Two from './02_teaminfo';
import Three from './03_squad';
import Finish from './04_finish';


interface State {
  continents: any[];
  formdata: Array<unknown>;
  logo?: string;
}


export default class Routes extends Component<RouteComponentProps, State> {
  private routes = [
    { path: '/', component: One, title: 'Player', icon: <UserOutlined /> },
    { path: '/firstrun/two', component: Two, title: 'Team', icon: <TeamOutlined /> },
    { path: '/firstrun/three', component: Three, title: 'Squad', icon: <TeamOutlined /> },
    { path: '/firstrun/finish', component: Finish, title: 'Finish', icon: <FileDoneOutlined /> },
  ];

  public state: State = {
    continents: [] as any[],
    formdata: [] as any[],
  }

  public async componentDidMount() {
    const { logo } = await IpcService.send( IPCRouting.Main.GET_APP_LOGO, {} );
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
    this.setState({ continents: data, logo });
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
    const { state, props, routes } = this;
    const active = routes.findIndex( r => r.path === props.location.pathname );

    return (
      <div id="firstrun">
        <section className="logocontainer">
          {state.logo
            ? <img src={state.logo} alt="LIGA Esports Manager" />
            : <Avatar size={150} icon={<LoadingOutlined />} style={{ background: 'none' }} />
          }
        </section>

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
