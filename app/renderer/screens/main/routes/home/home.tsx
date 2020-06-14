import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Button } from 'antd';
import * as IPCRouting from 'shared/ipc-routing';
import IpcService from 'renderer/lib/ipc-service';
import * as EmailTypes from 'renderer/screens/main/redux/emails/types';
import InboxPreview from 'renderer/screens/main/components/inbox-preview';
import Connector from 'renderer/screens/main/components/connector';


interface Props extends RouteComponentProps {
  dispatch: Function;
  emails: EmailTypes.EmailState;
}


class Home extends Component<Props> {
  public async handleOnNext() {
    await IpcService.send(
      IPCRouting.Worldgen.CALENDAR_NEXT,
      {}
    );
  }

  public render() {
    return (
      <div id="home" className="content">
        <Button
          block
          type="primary"
          size="large"
          onClick={this.handleOnNext}
          style={{ marginRight: 20 }}
        >
          {'Next'}
        </Button>
        <InboxPreview
          data={this.props.emails.data}
          onClick={id => this.props.history.push( `/inbox/${id}` )}
        />
      </div>
    );
  }
}


export default Connector.connect( Home );
