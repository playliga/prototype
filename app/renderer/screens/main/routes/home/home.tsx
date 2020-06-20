import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Button, Typography } from 'antd';

import * as IPCRouting from 'shared/ipc-routing';
import * as EmailTypes from 'renderer/screens/main/redux/emails/types';
import * as ProfileTypes from 'renderer/screens/main/redux/profile/types';

import IpcService from 'renderer/lib/ipc-service';
import InboxPreview from 'renderer/screens/main/components/inbox-preview';
import Connector from 'renderer/screens/main/components/connector';


interface Props extends RouteComponentProps {
  dispatch: Function;
  emails: EmailTypes.EmailState;
  profile: ProfileTypes.ProfileState;
}


class Home extends Component<Props> {
  public async handleOnNext() {
    await IpcService.send(
      IPCRouting.Worldgen.CALENDAR_LOOP,
      {}
    );
  }

  public render() {
    return (
      <div id="home" className="content">
        <section>
          <Typography.Title>
            {this.props.profile.data.currentDate.toString()}
          </Typography.Title>
          <Button
            block
            type="primary"
            size="large"
            onClick={this.handleOnNext}
          >
            {'Next'}
          </Button>
        </section>
        <InboxPreview
          data={this.props.emails.data}
          onClick={id => this.props.history.push( `/inbox/${id}` )}
        />
      </div>
    );
  }
}


export default Connector.connect( Home );
