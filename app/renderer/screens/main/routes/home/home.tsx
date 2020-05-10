import React, { Component } from 'react';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { RouteComponentProps } from 'react-router-dom';
import IpcService from 'renderer/lib/ipc-service';
import { InboxPreview } from '../../components/inbox-preview';


interface State {
  emails: any[];
}


class Home extends Component<RouteComponentProps, State> {
  public state = {
    emails: [] as any[],
  }

  public async componentDidMount() {
    ipcRenderer.on( '/worldgen/email/new', this.handleNewEmail );

    // get latest emails
    const data = await IpcService.send( '/database/', {
      params: {
        model: 'Email',
        method: 'findAll',
        args: {
          include: [{ all: true }],
          limit: 5
        }
      }
    });
    this.setState({ emails: data });
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
          onClick={id => this.props.history.push( `/inbox/${id}` )}
        />
      </div>
    );
  }
}


export default Home;
