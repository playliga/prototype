import React, { Component } from 'react';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { RouteComponentProps } from 'react-router-dom';
import { List, Avatar } from 'antd';


function InboxPreviewItem( props: any ) {
  return (
    <List.Item onClick={() => props.onClick()}>
      <List.Item.Meta
        avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
        description={props.contents}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{props.subject}</span>
            <span>{'May 2020'}</span>
          </div>
        }
      />
    </List.Item>
  );
}


function InboxPreview( props: any ) {
  return (
    <List
      header="Inbox"
      dataSource={props.data}
      renderItem={() => <InboxPreviewItem onClick={props.onClick} />}
    />
  );
}


interface State {
  emails: any[];
}


class Home extends Component<RouteComponentProps, State> {
  public state = {
    emails: [] as any[],
  }

  public componentDidMount() {
    ipcRenderer.on( '/screens/main/email/new', this.handleNewEmail );
  }

  private handleNewEmail = ( evt: IpcRendererEvent, data: any ) => {
    const { emails } = this.state;
    emails.push( JSON.parse( data ) );
    this.setState({ emails });
  }

  public render() {
    return (
      <div id="home" className="content">
        <InboxPreview
          data={this.state.emails}
          onClick={() => this.props.history.push( '/inbox' )}
        />
      </div>
    );
  }
}


export default Home;
