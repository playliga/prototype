import * as IPCRouting from 'shared/ipc-routing';
import * as profileActions from 'renderer/screens/main/redux/profile/actions';
import React from 'react';
import moment from 'moment';
import cuid from 'cuid';
import IpcService from 'renderer/lib/ipc-service';
import Connector from 'renderer/screens/main/components/connector';
import Header from 'renderer/screens/main/components/header';
import InboxPreview from 'renderer/screens/main/components/inbox-preview';
import MatchPreview from 'renderer/screens/main/components/match-preview';
import Standings from 'renderer/screens/main/components/standings';
import MatchResults from 'renderer/screens/main/components/match-results';
import { RouteComponentProps } from 'react-router-dom';
import { Card, Row, Col, Empty, Table, Affix } from 'antd';
import { parseCupRound } from 'shared/util';
import { UpcomingMatchResponse, StandingsResponse, ApplicationState } from 'renderer/screens/main/types';


// constants and variables
const CARD_PADDING = 5;
const COLSIZE_INBOX = 12;
const COLSIZE_MATCHPREV = 12;
const COLSIZE_STANDINGS = 12;
const COLSIZE_UPCOMING = 12;
const GUTTER_H = 8;
const GUTTER_V = 8;
const NUM_CUP_MATCHES = 9;
const NUM_INBOX_PREVIEW = 3;
const NUM_STANDINGS = 10;
const NUM_UPCOMING_MATCHES = 6;
const ROWHEIGHT_TOP = 230;
const ROWHEIGHT_BOTTOM = 500;


// declare interfaces and types
interface Props extends RouteComponentProps, ApplicationState {
  dispatch: Function;
}


/**
 * Helper functions
 */

async function handleOnNextDay( dispatch: Function, setLoading: Function ) {
  setLoading( true );
  IpcService
    .send( IPCRouting.Worldgen.CALENDAR_LOOP )
    .then( () => dispatch( profileActions.calendarFinish() ) )
    .then( () => Promise.resolve( setLoading( false )) )
  ;
}


async function handleOnPlay( upcoming: UpcomingMatchResponse, dispatch: Function, setLoading: Function, shouldsim = false ) {
  setLoading( true );
  IpcService
    .send( IPCRouting.Competition.PLAY, {
      params: {
        quid: upcoming.quid,
        compId: upcoming.competitionId,
        matchId: upcoming.match.id,
        sim: shouldsim
      }
    })
    .then( () => IpcService.send( IPCRouting.Worldgen.CALENDAR_LOOP, { params: { max: 1 }} ))
    .then( () => dispatch( profileActions.calendarFinish() ) )
    .then( () => Promise.resolve( setLoading( false )) )
  ;
}


/**
 * Helper components
 */

function UpcomingMatches( props: { data: UpcomingMatchResponse[]; userteamid: number }) {
  if( !props.data || props.data.length === 0 ) {
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
        width="20%"
        dataIndex="date"
        render={value => moment( value ).format( 'DD/MM' )}
      />
      <Table.Column
        width="20%"
        dataIndex="type"
        render={value => value[ 0 ] ? 'League' : 'Cup' }
      />
      <Table.Column
        width="10%"
        render={() => 'vs.'}
      />
      <Table.Column
        ellipsis
        render={value => (
          value.match.team1.id === props.userteamid
            ? value.match.team2.name
            : value.match.team1.name
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
  const [ loading, setLoading ] = React.useState( false );

  // set up some loading bools
  const hasUpcoming = upcoming && upcoming.length > 0;
  const hasStandings = standings && standings.length > 0;
  const isMatchday = hasUpcoming && profile.data && upcoming[ 0 ].date === profile.data.currentDate;
  const refreshUpcoming = hasUpcoming && moment( profile.data.currentDate ).isAfter( upcoming[ 0 ].date );
  const isleague = hasUpcoming && upcoming[ 0 ].type[ 0 ];
  const iscup = hasUpcoming && upcoming[ 0 ].type[ 1 ];
  const ispostseason = isleague && !!upcoming[ 0 ].postseason;

  // get upcoming matches
  React.useEffect( () => {
    if( isMatchday || ( hasUpcoming && !refreshUpcoming ) ) {
      return;
    }

    IpcService
      .send( IPCRouting.Competition.MATCHES_UPCOMING, {
        params: { limit: NUM_UPCOMING_MATCHES }
      })
      .then( res => setUpcoming( res ) )
    ;
  }, [ profile ]);

  // get standings for next match
  React.useEffect( () => {
    if( !upcoming ) {
      return;
    }

    if( !hasUpcoming ) {
      return setStandings([]);
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

  // find our team's seed number
  let seednum: number;

  if( hasStandings && isleague && standings[ 0 ].standings ) {
    seednum = standings[ 0 ]
      .standings
      .find( s => s.competitorInfo.id === profile.data.Team.id )
      .seed
    ;
  }

  return (
    <div id="home">
      {/* RENDER THE HEADER */}
      <Affix>
        <Header
          isMatchday={isMatchday}
          onNextDay={() => handleOnNextDay( props.dispatch, setLoading )}
          onPlay={sim => handleOnPlay( upcoming[ 0 ], props.dispatch, setLoading, sim )}
          loading={loading}
          {...props}
        />
      </Affix>

      {/* RENDER THE MAIN CONTENT */}
      <section className="content">
        <Row gutter={[ GUTTER_H, GUTTER_V ]}>
          {/* NEXT MATCH */}
          <Col span={COLSIZE_MATCHPREV}>
            <Card
              bodyStyle={{ height: ROWHEIGHT_TOP, padding: CARD_PADDING }}
              loading={!upcoming}
              title="Next Match"
            >
              <MatchPreview
                data={hasUpcoming && upcoming[ 0 ]}
                cs16_enabled={!!props.profile.data && props.profile.data.settings.cs16_enabled}
              />
            </Card>
          </Col>

          {/* UPCOMING MATCHES */}
          <Col span={COLSIZE_UPCOMING}>
            <Card
              bodyStyle={{ height: ROWHEIGHT_TOP, padding: CARD_PADDING }}
              loading={!upcoming}
              title="Upcoming Fixtures"
            >
              <UpcomingMatches
                data={hasUpcoming && upcoming.slice( 1 )}
                userteamid={props.profile.data && props.profile.data.Team.id}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[ GUTTER_H, GUTTER_V ]}>
          {/* INBOX PREVIEW */}
          <Col span={COLSIZE_INBOX}>
            <Card
              bodyStyle={{ height: ROWHEIGHT_BOTTOM }}
              loading={props.emails.loading}
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
              title={iscup ? 'Cup Matches' :'League Table'}
              bodyStyle={{ height: ROWHEIGHT_BOTTOM, padding: CARD_PADDING }}
              loading={!standings}
            >
              {isleague && !ispostseason && (
                <Standings
                  disablePagination
                  highlightSeed={seednum}
                  sliceData={NUM_STANDINGS}
                  dataSource={hasStandings && standings[ 0 ].standings && (
                    standings[ 0 ]
                      .standings
                      .map( ( s: any ) => ({
                        id: s.competitorInfo.id,
                        name: s.competitorInfo.name,
                        ...s,
                      }))
                  )}
                  title={hasStandings && (
                    `${standings[ 0 ].competition}: ${standings[ 0 ].region} | ${standings[ 0 ].division}`
                  )}
                  onClick={id => props.history.push( `/home/team/${id}` )}
                />
              )}
              {( iscup || ispostseason ) && (
                <MatchResults
                  pageSize={NUM_CUP_MATCHES}
                  dataSource={hasStandings && standings[ 0 ].round}
                  title={hasStandings && standings[ 0 ].round && parseCupRound( standings[ 0 ].round )}
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
