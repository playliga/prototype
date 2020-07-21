import React from 'react';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { Spin, Row, Col, Typography, Table, Button, Space, Alert } from 'antd';

import * as IPCRouting from 'shared/ipc-routing';
import * as ProfileTypes from 'renderer/screens/main/redux/profile/types';
import * as profileActions from 'renderer/screens/main/redux/profile/actions';
import IpcService from 'renderer/lib/ipc-service';
import Connector from 'renderer/screens/main/components/connector';


const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;


/**
 * Standings Component
 */

interface StandingsProps {
  children?: any;
  dataSource: any;
  disablePagination?: boolean;
  title?: string;
  pageSize?: number;
  size?: SizeType;
  rowKey?: string;
}


function Standings( props: StandingsProps ) {
  return (
    <Table
      size={props.size || 'small'}
      dataSource={props.dataSource}
      rowKey={props.rowKey || 'id'}
      pagination={!props.disablePagination && { pageSize: props.pageSize || 20, hideOnSinglePage: true }}
    >
      <Table.ColumnGroup title={props.title}>
        <Table.Column
          width="80%"
          title="Name"
          render={item => `${item.pos || 1}. ${item.name}`}
        />
        <Table.Column
          title="W/L"
          width="20%"
          render={t => `${t?.wins || 0}/${t?.losses || 0}`}
        />
        {props.children}
      </Table.ColumnGroup>
    </Table>
  );
}


/**
 * Competition Component
 */

function Competition( props: any ) {
  const nosquad = props.team.Players.length < 4;
  const joined = props
    .team
    .Competitions
    .findIndex( ( c: any ) => c.id === props.id )
  > -1;

  return (
    <Col key={props.id} span={GRID_COL_WIDTH}>
      <Typography.Title level={3}>
        {props.data.name}: {props.Continents[0].name}
      </Typography.Title>

      {/* LEAGUE NOT STARTED */}
      {/* SHOW TOP-DIVISION STANDINGS + JOIN BUTTON (IF APPLICABLE) */}
      {!props.data.started && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <em>{'Not started.'}</em>
          <Standings
            disablePagination
            title={props.data.divisions[0].name}
            dataSource={props.data.divisions[0].competitors.slice( 0, 10 )}
          />
          {nosquad && props.Compdef.isOpen && (
            <Alert
              type="warning"
              message="You don't have enough players in your squad to join."
            />
          )}
          {!nosquad && props.Compdef.isOpen && (
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

      {/* LEAGUE STARTED: SHOW GROUPS FOR FIRST DIVISION */}
      {props.data.started && (
        <Standings
          disablePagination
          title={props.data.divisions[0].name}
          dataSource={props
            .data
            .divisions[0]
            .conferences[0]
            .groupObj
            .standings
            .slice( 0, 10 )
            .map( ( s: any ) => ({
              id: s.competitorInfo.id,
              pos: s.pos,
              name: s.competitorInfo.name,
              wins: s.wins,
              losses: s.losses
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

interface Props {
  dispatch: Function;
  profile: ProfileTypes.ProfileState;
}


function Competitions( props: Props ) {
  const [ joining, setJoining ] = React.useState( false );
  const [ comps, setComps ] = React.useState([]);

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.COMPETITION_ALL )
      .then( c => setComps( c ) )
    ;
  }, []);

  if( !comps || comps.length <= 0 ) {
    return (
      <div id="competitions" className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div id="competitions" className="content">
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {comps.map( c => (
          <Competition
            {...c}
            key={c.id}
            team={props.profile.data.Team}
            joining={joining}
            onClick={async () => {
              setJoining( true );
              const newprofile = await IpcService.send(
                IPCRouting.Database.COMPETITION_JOIN, {
                  params: { id: c.id }
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
