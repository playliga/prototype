import React, { Component } from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import { Layout } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  PieChartOutlined,
  InboxOutlined,
  TrophyOutlined
} from '@ant-design/icons';

import * as EmailTypes from 'renderer/screens/main/redux/emails/types';
import * as emailSelectors from 'renderer/screens/main/redux/emails/selectors';
import * as emailActions from 'renderer/screens/main/redux/emails/actions';
import * as profileActions from 'renderer/screens/main/redux/profile/actions';
import * as Transfers from './transfers';

import { RouteConfig } from 'renderer/screens/main/types';
import Sidebar from 'renderer/screens/main/components/sidebar';
import Connector from 'renderer/screens/main/components/connector';
import Home from './home';
import Inbox from './inbox';


const routes: RouteConfig[] = [
  { id: '/home', path: '/home', component: Home, title: 'Home', icon: HomeOutlined },
  { id: '/inbox', path: '/inbox/:id?', component: Inbox, title: 'Inbox', icon: InboxOutlined },
  { id: '/squad', path: '/squad', component: Home, title: 'Squad', icon: UserOutlined },
  {
    id: '/transfers', path: '/transfers', title: 'Transfers', icon: PieChartOutlined,
    subroutes: [
      { id: '/transfers/search', path: '/transfers/search', component: Transfers.Search, title: 'Search Players' },
    ]
  },
  { id: '/competitions', path: '/competitions', component: Home, title: 'Competitions', icon: TrophyOutlined },
];


/**
 * The routes component.
 */

interface Props extends RouteComponentProps {
  dispatch: Function;
  emails: EmailTypes.EmailState;
  unread: number;
}


interface State {
  collapsed: boolean;
}


class Routes extends Component<Props, State> {
  public state = {
    collapsed: false,
  }

  private logourl = 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg';

  public async componentDidMount() {
    // sign up for ipc events
    this.props.dispatch( emailActions.register() );
    this.props.dispatch( profileActions.register() );

    // get initial data
    this.props.dispatch( emailActions.findAll() );
    this.props.dispatch( profileActions.find() );
  }

  private handleOnCollapse = ( collapsed: boolean ) => {
    this.setState({ collapsed });
  }

  public render() {
    // add unread e-mail notifications
    const emailidx = routes.findIndex( r => r.id === '/inbox' );
    routes[emailidx].notifications = this.props.unread;

    return (
      <Layout id="main">
        {/* RENDER THE SIDEBAR */}
        {routes.map( r => (
          <Route
            key={r.path}
            path={r.path}
            render={props => {
              if( r.subroutes ) {
                return r.subroutes.map( sr => (
                  <Route
                    key={sr.path}
                    path={sr.path}
                    render={srprops => (
                      <Sidebar
                        {...srprops}
                        parentPath={props.match.path}
                        config={routes}
                        logourl={this.logourl}
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
                  config={routes}
                  logourl={this.logourl}
                  collapsed={this.state.collapsed}
                  onCollapse={this.handleOnCollapse}
                />
              );
            }}
          />
        ))}

        {/* RENDER THE MAIN CONTENT */}
        <Layout.Content>
          {routes.map( r => (
            <Route
              key={r.path}
              path={r.path}
              render={props => {
                if( r.subroutes ) {
                  return r.subroutes.map( sr => (
                    <Route
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
        </Layout.Content>
      </Layout>
    );
  }
}


const connector = Connector.connect(
  Routes,
  { unread: emailSelectors.getUnread }
);


export default connector;
