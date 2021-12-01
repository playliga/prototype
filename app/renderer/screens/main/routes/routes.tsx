import React, { Component } from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import { Layout } from 'antd';
import { RouteConfig, ApplicationState } from 'renderer/screens/main/types';
import {
  HomeOutlined,
  UserOutlined,
  PieChartOutlined,
  InboxOutlined,
  TrophyOutlined,
  SettingOutlined
} from '@ant-design/icons';

import * as emailSelectors from 'renderer/screens/main/redux/emails/selectors';
import * as emailActions from 'renderer/screens/main/redux/emails/actions';
import * as profileSelectors from 'renderer/screens/main/redux/profile/selectors';
import * as profileActions from 'renderer/screens/main/redux/profile/actions';
import * as IPCRouting from 'shared/ipc-routing';

import Sidebar from 'renderer/screens/main/components/sidebar';
import Connector from 'renderer/screens/main/components/connector';
import Home from './home';
import Inbox from './inbox';
import Squad from './squad';
import Transfers from './transfers';
import Competitions from './competitions';
import Team from './team';
import Settings from './settings';
import IpcService from 'renderer/lib/ipc-service';


const routes: RouteConfig[] = [
  {
    id: '/home', path: '/home', title: 'Home', icon: HomeOutlined, sidebar: true,
    subroutes: [
      { id: '/home', path: '/home', component: Home, exact: true },
      { id: '/home/team', path: '/home/team/:id', component: Team, exact: true },
    ]
  },
  { id: '/inbox', path: '/inbox/:id?', component: Inbox, title: 'Inbox', icon: InboxOutlined, sidebar: true },
  { id: '/squad', path: '/squad', component: Squad, title: 'Squad', icon: UserOutlined, sidebar: true },
  { id: '/transfers', path: '/transfers', component: Transfers, title: 'Transfers', icon: PieChartOutlined, sidebar: true },
  {
    id: '/competitions', path: '/competitions', title: 'Competitions', icon: TrophyOutlined, sidebar: true,
    subroutes: [
      { id: '/competitions', path: '/competitions', component: Competitions, exact: true },
      { id: '/competitions/team', path: '/competitions/team/:id', component: Team, exact: true },
    ]
  },
  { id: '/settings', path: '/settings', component: Settings, title: 'Settings', icon: SettingOutlined, sidebar: true },
];


/**
 * The routes component.
 */

interface Props extends RouteComponentProps, ApplicationState {
  dispatch: Function;
  unread: number;
  offers: number;
}


interface State {
  collapsed: boolean;
  logo?: string;
}


class Routes extends Component<Props, State> {
  public state: State = {
    collapsed: false,
  }

  public async componentDidMount() {
    // sign up for ipc events
    this.props.dispatch( emailActions.register() );
    this.props.dispatch( profileActions.register() );

    // get initial data
    this.props.dispatch( emailActions.findAll() );
    this.props.dispatch( profileActions.find() );

    // get logo
    const { logo } = await IpcService.send( IPCRouting.Main.GET_APP_LOGO, {} );
    this.setState({ logo });
  }

  private handleOnCollapse = ( collapsed: boolean ) => {
    this.setState({ collapsed });
  }

  public render() {
    // add unread e-mail notifications
    const emailidx = routes.findIndex( r => r.id === '/inbox' );
    const squadidx = routes.findIndex( r => r.id === '/squad' );
    routes[emailidx].notifications = this.props.unread;
    routes[squadidx].notifications = this.props.offers;

    return (
      <Layout id="main">
        {/* RENDER THE SIDEBAR */}
        <Switch>
          {routes.map( r => (
            <Route
              exact={r.exact}
              key={r.path}
              path={r.path}
              render={props => {
                if( r.subroutes ) {
                  return r.subroutes.map( sr => (
                    <Route
                      exact={sr.exact}
                      key={sr.path}
                      path={sr.path}
                      render={srprops => (
                        <Sidebar
                          {...srprops}
                          parent={r.path}
                          config={routes}
                          logourl={this.state.logo}
                          collapsed={this.state.collapsed}
                          onCollapse={this.handleOnCollapse}
                        />
                      )}
                    />
                  ));
                }

                return (
                  <Sidebar
                    {...props}
                    parent={r.path}
                    config={routes}
                    logourl={this.state.logo}
                    collapsed={this.state.collapsed}
                    onCollapse={this.handleOnCollapse}
                  />
                );
              }}
            />
          ))}
        </Switch>

        {/* RENDER THE CENTER CONTENT */}
        <Layout.Content
          id="route-container"
          className={this.state.collapsed ? 'collapsed' : ''}
        >
          <Switch>
            {routes.map( r => (
              <Route
                key={r.path}
                path={r.path}
                exact={r.exact}
                render={props => {
                  if( r.subroutes ) {
                    return r.subroutes.map( sr => (
                      <Route
                        exact={sr.exact}
                        key={sr.path}
                        path={sr.path}
                        component={sr.component}
                      />
                    ));
                  }

                  return React.createElement( r.component, props );
                }}
              />
            ))}
          </Switch>
        </Layout.Content>
      </Layout>
    );
  }
}


const connector = Connector.connect(
  Routes,
  {
    unread: emailSelectors.getUnread,
    offers: profileSelectors.getOffers,
  }
);


export default connector;
