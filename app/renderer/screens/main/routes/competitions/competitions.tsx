import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import Connector from 'renderer/screens/main/components/connector';
import Standings from 'renderer/screens/main/components/standings';
import Application from 'main/constants/application';
import MatchResults from 'renderer/screens/main/components/match-results';
import * as profileActions from 'renderer/screens/main/redux/profile/actions';
import * as IPCRouting from 'shared/ipc-routing';
import { Spin, Row, Col, Typography, Space, Alert, Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { StandingsResponse, ApplicationState } from 'renderer/screens/main/types';
import { parseCupRound } from 'renderer/screens/main/util';


const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;
const NUM_CUP_MATCHES = 10;
const NUM_STANDINGS = 10;
const SQUAD_STARTERS_NUM = Application.SQUAD_MIN_LENGTH;


interface Props extends ApplicationState {
  dispatch: Function;
}


interface CompetitionProps {
  data: StandingsResponse;
  joining: boolean;
  onClick: () => void;
  team: any;
}


/**
 * Competition Component
 */

function Competition( props: CompetitionProps ) {
  const nosquad = props.team.Players.length < SQUAD_STARTERS_NUM;
  const sameregion = props.team.Country.ContinentId === props.data.regionId;
  const [ isleague, iscup ] = props.data.type;
  const joined = props
    .team
    .Competitions
    .findIndex( ( c: any ) => c.id === props.data.competitionId )
  > -1;

  return (
    <Col key={props.data.competitionId} span={GRID_COL_WIDTH}>
      <Typography.Title level={3}>
        <Space>
          <Typography.Text ellipsis>
            {props.data.competition}: {props.data.regioncode}
          </Typography.Text>
          <Typography.Link>
            <RightOutlined />
          </Typography.Link>
        </Space>
      </Typography.Title>

      {/* COMPETITION NOT STARTED */}
      {( ( isleague && props.data.standings.length === 0 ) || ( iscup && props.data.round.length === 0 ) ) && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <em>{'Not started.'}</em>
          {nosquad && sameregion && props.data.isOpen && (
            <Alert
              type="warning"
              message="You don't have enough players in your squad to join."
            />
          )}
          {!nosquad && sameregion && props.data.isOpen && (
            <Button
              block
              type="primary"
              disabled={props.joining || joined || nosquad}
              onClick={props.onClick}
            >
              {props.joining
                ? <Spin size="small" />
                : joined
                  ? 'Joined'
                  : 'Join'
              }
            </Button>
          )}
        </Space>
      )}

      {/* LEAGUE STARTED: SHOW GROUPS FOR FIRST CONFERENCE */}
      {isleague && props.data.standings.length > 0 && (
        <Standings
          disablePagination
          sliceData={NUM_STANDINGS}
          title={props.data.division}
          dataSource={props
            .data
            .standings
            .map( ( s: any ) => ({
              id: s.competitorInfo.id,
              name: s.competitorInfo.name,
              ...s,
            }))
          }
        />
      )}

      {/* CUP STARTED */}
      {iscup && props.data.round.length > 0 && (
        <MatchResults
          sliceData={NUM_CUP_MATCHES}
          title={parseCupRound( props.data.round )}
          dataSource={props.data.round}
        />
      )}
    </Col>
  );
}


/**
 * Main Route Component
 */

function Competitions( props: Props ) {
  const [ joining, setJoining ] = React.useState( false );
  const [ standings, setStandings ] = React.useState<StandingsResponse[][]>([]);

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Competition.STANDINGS, {
        params: {
          divIdx: 0
        }
      })
      .then( res => setStandings( res ) )
    ;
  }, []);

  if( !standings || standings.length === 0 ) {
    return (
      <div id="competitions" className="content">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div id="competitions" className="content">
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {standings.map( ([ comp ]) => (
          <Competition
            key={comp.competitionId}
            team={props.profile.data.Team}
            joining={joining}
            data={comp}
            onClick={async () => {
              setJoining( true );
              const newprofile = await IpcService.send(
                IPCRouting.Competition.JOIN, {
                  params: { id: comp.competitionId }
                }
              );
              props.dispatch( profileActions.findFinish( newprofile ) );
              setJoining( false );
            }}
          />
        ))}
      </Row>
    </div>
  );
}


export default Connector.connect( Competitions );
