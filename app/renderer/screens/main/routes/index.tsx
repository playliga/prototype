import React, { Component } from 'react';
import { Route, Link, Switch, RouteComponentProps } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { HomeOutlined, UserOutlined, PieChartOutlined, InboxOutlined, TrophyOutlined } from '@ant-design/icons';
import Home from './home';
import Inbox from './inbox';


const { Content, Sider } = Layout;
const SubMenu = Menu.SubMenu;


interface State {
  collapsed: boolean;
}


class Routes extends Component<RouteComponentProps, State> {
  private imgdata = 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg';

  public state = {
    collapsed: false,
  }

  private handleOnCollapse = ( collapsed: boolean ) => {
    this.setState({ collapsed });
  }

  private renderSider = () => {
    const { location } = this.props;

    return (
      <Sider
        id="main-navigation"
        collapsible
        collapsed={this.state.collapsed}
        onCollapse={this.handleOnCollapse}
      >
        <section className="logocontainer">
          <img src={this.imgdata} alt="La Liga" />
        </section>
        <Menu theme="dark" selectedKeys={[ location.pathname ]} mode="inline">
          <Menu.Item key="/">
            <HomeOutlined />
            <Link to="/">{'Home'}</Link>
          </Menu.Item>
          <Menu.Item key="/inbox">
            <InboxOutlined />
            <Link to="/inbox">{'Inbox'}</Link>
          </Menu.Item>
          <Menu.Item key="/squad">
            <UserOutlined />
            <span>Squad</span>
          </Menu.Item>
          <SubMenu
            key="/transfers"
            title={(
              <span>
                <PieChartOutlined />
                <span>Transfer Market</span>
              </span>
            )}
          >
            <Menu.Item key="3">Buy Players</Menu.Item>
            <Menu.Item key="4">Search Players</Menu.Item>
          </SubMenu>
          <Menu.Item key="/competitions">
            <TrophyOutlined />
            <span>Competitions</span>
          </Menu.Item>
        </Menu>
      </Sider>
    );
  }

  private renderCenterContent = () => {
    return (
      <Content>
        <Switch location={this.props.location}>
          <Route path="/" exact component={Home} />
          <Route path="/inbox" exact component={Inbox} />
        </Switch>
      </Content>
    );
  }

  public render() {
    return (
      <Layout id="main">
        {this.renderSider()}
        {this.renderCenterContent()}
      </Layout>
    );
  }
}


export default Routes;
