import React, { Component } from 'react';
import { Layout, Menu, Icon, Card } from 'antd';
import GroupStage from 'groupstage';
import IpcService from 'renderer/lib/ipc-service';


const imgdata = 'https://upload.wikimedia.org/wikipedia/en/1/13/Real_betis_logo.svg';


interface State {
  collapsed: boolean;
  comp: any;
}


const { Content, Sider } = Layout;
const SubMenu = Menu.SubMenu;


function Conference( props: any ) {
  const { groupObj, competitors } = props;
  const groupstage = GroupStage.restore( groupObj.numPlayers, groupObj.groupSize, groupObj.state );
  const standings = groupstage.results();

  return (
    <div className="groupscontainer">
      <div>
        <p>{'Pos.'}</p>
        <p>{'Name'}</p>
        <p>{'Win'}</p>
        <p>{'Draw'}</p>
        <p>{'Loss'}</p>
        <p>{'Pts'}</p>
      </div>
      {standings.map( ( s: any, idx: any ) => (
        <div key={idx}>
          <p>{s.gpos}</p>
          <p>{competitors[ s.seed - 1 ].name}</p>
          <p>{s.wins}</p>
          <p>{s.draw}</p>
          <p>{s.losses}</p>
          <p>{s.pts}</p>
        </div>
      ))}
    </div>
  );
}


function Division( props: any ) {
  return (
    <section className="divisioncontainer">
      <h2>Division name: {props.name}</h2>
      <div>
        {props.conferences.map( ( c: any ) => <Conference key={c.id} {...c} /> )}
      </div>
    </section>
  );
}


class Home extends Component<{}, State> {
  public state = {
    collapsed: false,
    comp: null,
  }

  public async componentDidMount() {
    const comp = await IpcService.send( '/database/', {
      params: {
        model: 'Competition',
        method: 'startLeague',
        args: { id: 1 }
      }
    });
    this.setState({ comp });
  }

  private handleOnCollapse = ( collapsed: boolean ) => {
    this.setState({ collapsed });
  }

  private renderSider = () => {
    return (
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
    );
  }

  private renderCenterContent = () => {
    const { comp } = this.state;

    if( !comp ) {
      return null;
    }

    return (
      <Layout>
        <Content className="content">
          <Card>
            {comp.data.divisions.map( ( d: any ) => (
              <Division key={d.name} {...d} />
            ))}
          </Card>
        </Content>
      </Layout>
    );
  }

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
