import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import moment from 'moment';
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


function formatDate( str: string | undefined ) {
  if( !str ) {
    return null;
  }

  return moment( str ).format( 'MMM DD, YYYY' );
}


async function handleOnNext() {
  await IpcService.send(
    IPCRouting.Worldgen.CALENDAR_LOOP,
    {}
  );
}


function Home( props: Props ) {
  const { profile } = props;
  const formatteddate = formatDate( profile.data?.currentDate );

  return (
    <div id="home" className="content">
      <section>
        <Typography.Title>
          {formatteddate?.toString() || 'Loading...'}
        </Typography.Title>
        <Button
          block
          type="primary"
          size="large"
          onClick={handleOnNext}
        >
          {'Next'}
        </Button>
      </section>
      <InboxPreview
        data={props.emails.data}
        onClick={id => props.history.push( `/inbox/${id}` )}
      />
    </div>
  );
}


export default Connector.connect( Home );
