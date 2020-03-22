import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { Layout, Menu, Icon, Card } from 'antd';


const imgdata = 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg';


interface State {
  collapsed: boolean;
}


const {
  Content, Sider
} = Layout;


const SubMenu = Menu.SubMenu;


class Home extends Component<{}, State> {
  public state = {
    collapsed: false
  }

  public componentDidMount() {
    ipcRenderer.send( '/database/find', { dsname: 'teams' });
    ipcRenderer.on( '/database/find', this.handleTeamsFetch );
  }

  private handleTeamsFetch = ( evt: object, teams: any[] ) => {
    console.log( teams );
  }

  private handleOnCollapse = ( collapsed: boolean ) => {
    this.setState({ collapsed });
  }

  private renderSider = () => (
    <Sider
      collapsible
      collapsed={this.state.collapsed}
      onCollapse={this.handleOnCollapse}
    >
      <section className="logocontainer">
        <img src={imgdata} alt="La Liga" />
      </section>
      <Menu theme="dark" defaultSelectedKeys={[ '1' ]} mode="inline">
        <Menu.Item key="1">
          <Icon type="home" />
          <span>Home</span>
        </Menu.Item>
        <Menu.Item key="2">
          <Icon type="user" />
          <span>Squad</span>
        </Menu.Item>
        <SubMenu
          key="sub1"
          title={(
            <span>
              <Icon type="pie-chart" />
              <span>Transfer Market</span>
            </span>
          )}
        >
          <Menu.Item key="3">Buy Players</Menu.Item>
          <Menu.Item key="4">Search Players</Menu.Item>
        </SubMenu>
      </Menu>
    </Sider>
  )

  private renderCenterContent = () => (
    <Layout>
      <Content className="content">
        <Card>
          {'Hello'}
        </Card>
      </Content>
    </Layout>
  )

  public render() {
    return (
      <Layout id="home">
        {this.renderSider()}
        {this.renderCenterContent()}
      </Layout>
    );
  }
}

export default Home;
