import React from 'react';
import cuid from 'cuid';
import { RouteComponentProps } from 'react-router-dom';
import { Card, Row, Col, Empty, Table } from 'antd';
import { UpcomingMatchResponse, StandingsResponse, ApplicationState } from 'renderer/screens/main/types';

import * as IPCRouting from 'shared/ipc-routing';
import IpcService from 'renderer/lib/ipc-service';
import Connector from 'renderer/screens/main/components/connector';
import Header from 'renderer/screens/main/components/header';
import InboxPreview from 'renderer/screens/main/components/inbox-preview';
import MatchPreview from 'renderer/screens/main/components/match-preview';
import Standings from 'renderer/screens/main/components/standings';


// constants and variables
const CARD_PADDING = 5;
const COLSIZE_INBOX = 12;
const COLSIZE_MATCHPREV = 12;
const COLSIZE_STANDINGS = 12;
const COLSIZE_UPCOMING = 12;
const GUTTER_H = 8;
const GUTTER_V = 8;
const NUM_INBOX_PREVIEW = 3;
const NUM_STANDINGS = 10;
const NUM_UPCOMING_MATCHES = 6;
const TOP_ROW_HEIGHT = 230;
const BOT_ROW_HEIGHT = 500;


// declare interfaces and types
interface Props extends RouteComponentProps, ApplicationState {
  dispatch: Function;
}


/**
 * Helper functions
 */

async function handleOnNextDay() {
  await IpcService.send( IPCRouting.Worldgen.CALENDAR_LOOP );
}


/**
 * Helper components
 */

function UpcomingMatches( props: { data: UpcomingMatchResponse[]; seed: number }) {
  if( props.data && props.data.length === 0 ) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_DEFAULT}
        description="No upcoming matches."
      />
    );
  }

  return (
    <Table
      dataSource={props.data}
      pagination={false}
      rowKey={() => cuid()}
      showHeader={false}
      size="small"
    >
      <Table.Column
        width="15%"
        render={() => 'v.'}
      />
      <Table.Column
        ellipsis
        dataIndex="match"
        render={value => (
          value.team1.seed === props.seed
            ? value.team2.name
            : value.team1.name
        )}
      />
    </Table>
  );
}


/**
 * Main component
 */

function Home( props: Props ) {
  const { profile } = props;
  const [ upcoming, setUpcoming ] = React.useState<UpcomingMatchResponse[]>();
  const [ standings, setStandings ] = React.useState<StandingsResponse[]>();

  // find our team's seed number
  let seednum: number;

  if( standings && standings.length > 0 ) {
    seednum = standings[ 0 ]
      .standings
      .find( s => s.competitorInfo.id === profile.data.Team.id )
      .seed
    ;
  }

  // get upcoming matches
  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Competition.MATCHES_UPCOMING, {
        params: { limit: NUM_UPCOMING_MATCHES }
      })
      .then( res => setUpcoming( res ) )
    ;
  }, []);

  // get standings for next match (idx=0)
  React.useEffect( () => {
    if( !upcoming || upcoming.length === 0 ) {
      return;
    }

    IpcService
      .send( IPCRouting.Competition.STANDINGS, {
        params: {
          compId: upcoming[ 0 ].competitionId,
          confId: upcoming[ 0 ].confId,
          divName: upcoming[ 0 ].division
        }
      })
      .then( res => setStandings( res[ 0 ] ) )
    ;
  }, [ upcoming ]);

  return (
    <div id="home">
      {/* RENDER THE HEADER */}
      <Header
        onNextDay={handleOnNextDay}
        {...props}
      />

      {/* RENDER THE MAIN CONTENT */}
      <section className="content">
        <Row gutter={[ GUTTER_H, GUTTER_V ]}>
          {/* NEXT MATCH */}
          <Col span={COLSIZE_MATCHPREV}>
            <Card
              bodyStyle={{ height: TOP_ROW_HEIGHT }}
              loading={!upcoming}
              title="Next Match"
            >
              <MatchPreview data={upcoming && upcoming[ 0 ]} />
            </Card>
          </Col>

          {/* UPCOMING MATCHES */}
          <Col span={COLSIZE_UPCOMING}>
            <Card
              bodyStyle={{ height: TOP_ROW_HEIGHT, padding: CARD_PADDING }}
              loading={!upcoming}
              title="Upcoming Fixtures"
            >
              <UpcomingMatches
                seed={seednum}
                data={upcoming && upcoming.slice( 1 )}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[ GUTTER_H, GUTTER_V ]}>
          {/* INBOX PREVIEW */}
          <Col span={COLSIZE_INBOX}>
            <Card
              bodyStyle={{ height: BOT_ROW_HEIGHT }}
              loading={props.emails.data.length === 0}
              title="Inbox"
            >
              <InboxPreview
                data={props.emails.data.slice( 0, NUM_INBOX_PREVIEW )}
                onClick={id => props.history.push( `/inbox/${id}` )}
              />
            </Card>
          </Col>

          {/* STANDINGS PREVIEW */}
          <Col span={COLSIZE_STANDINGS}>
            <Card
              title="League Table"
              bodyStyle={{ height: BOT_ROW_HEIGHT, padding: CARD_PADDING }}
              loading={!standings}
            >
              {standings && standings.length > 0 && (
                <Standings
                  disablePagination
                  highlightSeed={seednum}
                  title={`${standings[ 0 ].competition}: ${standings[ 0 ].region} | ${standings[ 0 ].division}`}
                  dataSource={standings[ 0 ]
                    .standings
                    .slice( 0, NUM_STANDINGS )
                    .map( ( s: any ) => ({
                      id: s.competitorInfo.id,
                      name: s.competitorInfo.name,
                      ...s,
                    }))
                  }
                />
              )}
            </Card>
          </Col>
        </Row>
      </section>
    </div>
  );
}


export default Connector.connect( Home );
