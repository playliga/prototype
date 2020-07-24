import React from 'react';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import { RouteComponentProps } from 'react-router-dom';
import { Button, Typography, Card, Space, Tooltip, Spin, Avatar, Empty } from 'antd';
import { PlayCircleFilled, UserOutlined } from '@ant-design/icons';

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


/**
 * Helper functions
 */

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


/**
 * Functional components
 */

const INBOX_PREVIEW_NUM = 3;


function Home( props: Props ) {
  const { profile } = props;
  const [ upcoming, setUpcoming ] = React.useState([]);
  const formatteddate = formatDate( profile.data?.currentDate );

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.COMPETITION_TEAM_MATCHES_UPCOMING )
      .then( res => setUpcoming( res ) )
    ;
  }, []);

  const cardactions = upcoming && upcoming.length > 0
    ? [
      <Tooltip title="Play!" key="play">
        <PlayCircleFilled
          onClick={() => ipcRenderer.send( '/game/start', { responsechannel: '/game/start' } )}
        />
      </Tooltip>
    ] : null
  ;

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
          style={{ marginBottom: 20 }}
        >
          {'Next'}
        </Button>

        <Card title="Upcoming Match" actions={cardactions}>
          {!upcoming && <Spin size="small" />}

          {upcoming && upcoming.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No upcoming matches."
            />
          )}

          {upcoming && upcoming.length > 0 && (
            <>
              <div style={{ textAlign: 'center' }}>
                <Typography.Title level={4} style={{ marginBottom: 0 }}>
                  {upcoming[0].competition.data.name}: {upcoming[0].competition.Continents[0].name}
                </Typography.Title>
                <Typography.Text>
                  {upcoming[0].division.name}
                </Typography.Text>
              </div>
              <div className="match-preview-body">
                <Space direction="vertical">
                  <Avatar size={100} icon={<UserOutlined />} />
                  <span>{upcoming[0].matches[0].team1.name}</span>
                </Space>
                <Typography.Text strong className="vs">
                  {'VS'}
                </Typography.Text>
                <Space direction="vertical">
                  <Avatar size={100} icon={<UserOutlined />} />
                  <span>{upcoming[0].matches[0].team2.name}</span>
                </Space>
              </div>
            </>
          )}
        </Card>
      </section>
      <InboxPreview
        data={props.emails.data.slice( 0, INBOX_PREVIEW_NUM )}
        onClick={id => props.history.push( `/inbox/${id}` )}
      />
    </div>
  );
}


export default Connector.connect( Home );
