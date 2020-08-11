import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import Connector from 'renderer/screens/main/components/connector';
import Standings from 'renderer/screens/main/components/standings';
import { Spin, Row, Col, Typography, Space, Alert, Button } from 'antd';
import { StandingsResponse, ApplicationState } from 'renderer/screens/main/types';
import * as profileActions from 'renderer/screens/main/redux/profile/actions';
import * as IPCRouting from 'shared/ipc-routing';


const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;
const SQUAD_STARTERS_NUM = 5;


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
  const joined = props
    .team
    .Competitions
    .findIndex( ( c: any ) => c.id === props.data.competitionId )
  > -1;

  return (
    <Col key={props.data.competitionId} span={GRID_COL_WIDTH}>
      <Typography.Title level={3}>
        {props.data.competition}: {props.data.region}
      </Typography.Title>

      {/* LEAGUE NOT STARTED */}
      {props.data.standings.length === 0 && (
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
      {props.data.standings.length > 0 && (
        <Standings
          disablePagination
          sliceData={10}
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
    </Col>
  );
}


/**
 * Main Route Component
 */

function Competitions( props: Props ) {
  const [ joining, setJoining ] = React.useState( false );
  const [ competitions, setCompetitions ] = React.useState<StandingsResponse[][]>([]);

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Competition.STANDINGS, {
        params: {
          divIdx: 0
        }
      })
      .then( res => setCompetitions( res ) )
    ;
  }, []);

  if( !competitions || competitions.length === 0 ) {
    return (
      <div id="competitions" className="content">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div id="competitions" className="content">
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {competitions.map(([ comp ]) => (
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
