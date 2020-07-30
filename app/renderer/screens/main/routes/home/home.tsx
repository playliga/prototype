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
import Standings from  'renderer/screens/main/components/standings';


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
  const [ standings, setStandings ] = React.useState([]);
  const formatteddate = formatDate( profile.data?.currentDate );

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.COMPETITION_TEAM_MATCHES_UPCOMING )
      .then( res => setUpcoming( res ) )
    ;
    IpcService
      .send( IPCRouting.Database.COMPETITION_TEAM_STANDINGS )
      .then( res => setStandings( res ) )
    ;
  }, []);

  const cardactions = upcoming && upcoming.length > 0
    ? [
      <Tooltip title="Play!" key="play">
        <PlayCircleFilled
          onClick={() => ipcRenderer.send( '/game/play', {
            responsechannel: '/game/play',
            params: {
              id: upcoming[ 0 ].competition.id,
            }
          } )}
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
      <section>
        <InboxPreview
          data={props.emails.data.slice( 0, INBOX_PREVIEW_NUM )}
          onClick={id => props.history.push( `/inbox/${id}` )}
        />
        {( !standings || standings.length === 0 ) && (
          <Spin size="large" />
        )}

        {standings && standings.length > 0 && ([
          <Typography.Title style={{ textAlign: 'center' }} level={3} key="standings-title">
            {standings[ 0 ].competition.data.name}: {standings[ 0 ].competition.Continents[0].name}
          </Typography.Title>,
          <Standings
            key="standings"
            disablePagination
            highlightSeed={standings[0].seed}
            title={standings[ 0 ].division.name}
            dataSource={standings[ 0 ]
              .standings
              .map( ( s: any ) => ({
                id: s.competitorInfo.id,
                name: s.competitorInfo.name,
                ...s,
              }))
            }
          />
        ])}
      </section>
    </div>
  );
}


export default Connector.connect( Home );
