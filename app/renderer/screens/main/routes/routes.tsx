import React, { Component } from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import { Layout } from 'antd';
import { HomeOutlined, UserOutlined, PieChartOutlined, InboxOutlined, TrophyOutlined } from '@ant-design/icons';
import { RouteConfig } from 'renderer/screens/main/types';
import Sidebar from 'renderer/screens/main/components/sidebar';
import Connector from 'renderer/screens/main/components/connector';
import * as emailActions from 'renderer/screens/main/redux/emails/actions';
import * as EmailTypes from 'renderer/screens/main/redux/emails/types';
import Home from './home';
import Inbox from './inbox';


const routes: RouteConfig[] = [
  { key: '/', path: '/', component: Home, title: 'Home', icon: HomeOutlined },
  { key: '/inbox', path: '/inbox/:id?', component: Inbox, title: 'Inbox', icon: InboxOutlined },
  { key: '/squad', path: '/squad', component: Home, title: 'Squad', icon: UserOutlined },
  {
    key: '/transfers', path: '/transfers', component: Home, title: 'Transfers', icon: PieChartOutlined,
    subroutes: [
      { key: '/transfers/buy', path: '/transfers/buy', component: Home, title: 'Buy Players' },
      { key: '/transfers/search', path: '/transfers/search', component: Home, title: 'Search Players' },
    ]
  },
  { key: '/competitions', path: '/competitions', component: Home, title: 'Competitions', icon: TrophyOutlined },
];


/**
 * The routes component.
 */


interface Props extends RouteComponentProps {
  dispatch: Function;
  emails: EmailTypes.EmailState;
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
    this.props.dispatch( emailActions.register() );
    this.props.dispatch( emailActions.findAll() );
  }

  private handleOnCollapse = ( collapsed: boolean ) => {
    this.setState({ collapsed });
  }

  public render() {
    // add any notifications
    const { emails } = this.props;

    if( emails && emails.data && emails.data.length > 0 ) {
      const emailidx = routes.findIndex( r => r.key === '/inbox' );
      routes[emailidx].notifications = emails.data.filter( e => e.read === false ).length;
    }

    return (
      <Layout id="main">
        {/* RENDER THE SIDEBAR */}
        {routes.map( r => (
          <Route
            exact
            key={r.path}
            path={r.path}
            render={props => (
              <Sidebar
                {...props}
                config={routes}
                logourl={this.logourl}
                collapsed={this.state.collapsed}
                onCollapse={this.handleOnCollapse}
              />
            )}
          />
        ))}

        {/* RENDER THE MAIN CONTENT */}
        <Layout.Content>
          {routes.map( r => (
            <Route
              exact
              key={r.path}
              path={r.path}
              component={r.component}
            />
          ))}
        </Layout.Content>
      </Layout>
    );
  }
}


const connector = Connector.connect( Routes );
export default connector;
