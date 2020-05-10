import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import IpcService from 'renderer/lib/ipc-service';
import { InboxPreview } from 'renderer/screens/main/components/inbox-preview';
import { InboxFull } from 'renderer/screens/main/components/inbox-full';


interface State {
  selected: number;
  emails: any[];
}

interface RouteParams {
  id: string;
}


class Inbox extends Component<RouteComponentProps<RouteParams>, State> {
  public state = {
    selected: 0,
    emails: [] as any[]
  }

  public async componentDidMount() {
    ipcRenderer.on( '/worldgen/email/new', this.handleNewEmail );

    const emails = await IpcService.send( '/database/', {
      params: {
        model: 'Email',
        method: 'findAll',
        args: {
          include: [{ all: true }],
        }
      }
    });

    // default to the first item in the array
    let selected = emails.length > 0 ? emails[ 0 ].id : 0;

    // if params were provided tho, override the default
    const { id: selectedid } = this.props.match.params;

    if( selectedid ) {
      selected = parseInt( selectedid );
    }

    // set the state
    this.setState({ selected, emails });
  }

  private handleNewEmail = ( evt: IpcRendererEvent, data: any ) => {
    const { emails } = this.state;
    emails.push( JSON.parse( data ) );
    this.setState({ emails });
  }

  public render() {

    if( this.state.emails.length <= 0 ) {
      return null;
    }

    const email = this.state.emails.find( e => e.id === this.state.selected );

    return (
      <div id="inbox" className="content">
        <section className="preview">
          <InboxPreview
            selected={this.state.selected}
            data={this.state.emails}
            onClick={id => this.setState({ selected: id })}
          />
        </section>
        <section className="email">
          <InboxFull data={email} />
        </section>
      </div>
    );
  }
}


export default Inbox;
