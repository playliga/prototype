import React, { Component } from 'react';
import { Layout, Menu, Icon, Card } from 'antd';
import IpcService from 'renderer/lib/ipc-service';


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

  public async componentDidMount() {
    const [ comp ] = await IpcService.send( '/database/', {
      params: {
        model: 'Competition',
        method: 'findAll',
      }
    });

    // @todo: this fails because it's just a plain object.
    // @todo: needs to be converted to a league type.
    //
    // this logic should be kept in the renderer process
    // the competition model should explose helper
    // methods that help manage the league.
    const { data } = comp;
    data.start();
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
