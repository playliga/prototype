import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import * as EmailTypes from 'renderer/screens/main/redux/emails/types';
import * as emailActions from 'renderer/screens/main/redux/emails/actions';

import InboxPreview from 'renderer/screens/main/components/inbox-preview';
import InboxFull from 'renderer/screens/main/components/inbox-full';
import Connector from 'renderer/screens/main/components/connector';


interface RouteParams {
  id: string;
}


interface Props extends RouteComponentProps<RouteParams> {
  dispatch: Function;
  emails: EmailTypes.EmailState;
}


interface State {
  selected: number;
}


class Inbox extends Component<Props, State> {
  public state = {
    selected: 0,
  }

  private toggleRead( selected: number, emails: EmailTypes.EmailState ) {
    const email = emails.data.find( e => e.id === selected );

    if( selected && email ) {
      email.read = true;
      this.props.dispatch( emailActions.update( email ) );
    }
  }

  public async componentDidMount() {
    const { emails } = this.props;

    // default to the first item in the array
    let selected = emails.data.length > 0 ? emails.data[ 0 ].id : 0;

    // if params were provided tho, override the default
    const { id: selectedid } = this.props.match.params;

    if( selectedid ) {
      selected = parseInt( selectedid );
    }

    // if there's something selected, toggle it's read status
    if( selected ) {
      this.toggleRead( selected, emails );
    }

    // set the state
    this.setState({ selected });
  }

  public render() {
    const { emails } = this.props;
    const { selected } = this.state;


    // @todo: proper no data page
    if( emails.data.length <= 0 ) {
      return null;
    }

    // check if there's a selected email
    const email = emails.data.find( e => e.id === selected );

    return (
      <div id="inbox" className="content">
        <section className="preview">
          <InboxPreview
            selected={selected}
            data={emails.data}
            onClick={id => {
              this.toggleRead( id, emails );
              this.setState({ selected: id });
            }}
          />
        </section>
        <section className="email">
          {!!email && <InboxFull data={email} />}
        </section>
      </div>
    );
  }
}


export default Connector.connect( Inbox );
