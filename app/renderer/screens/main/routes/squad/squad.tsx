import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import Connector from 'renderer/screens/main/components/connector';
import PlayerCard from 'renderer/screens/main/components/player-card';
import { RouteComponentProps } from 'react-router';
import { ipcRenderer } from 'electron';
import { dropRight, uniq } from 'lodash';
import { Row, Col, Spin, Empty, Button, Card, Typography, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ApplicationState } from 'renderer/screens/main/types';
import * as IPCRouting from 'shared/ipc-routing';
import * as ProfileActions from 'renderer/screens/main/redux/profile/actions';


interface Props extends RouteComponentProps, ApplicationState {
  dispatch: Function;
}


const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;
const MAX_TRAINING = 4;


/**
 * CARD: EXTRA COMPONENT
 *
 * Renders the contents of the "extra"
 * prop for the Card component.
 */

function RemainingSessions( props: any ) {
  return (
    <Typography.Text type="secondary" code>
      {'Sessions Remaining:'} {props.num}
    </Typography.Text>
  );
}


/**
 * Squad Route Component
 *
 * Enables user to interact with their squad.
 */

// toggle training selection
function toggleSelection( selection: number[], setSelection: Function, id: number ) {
  if( selection.includes( id ) ) {
    return setSelection( selection.filter( sel => sel !== id ) );
  }

  if( selection.length >= MAX_TRAINING ) {
    return setSelection([ ...dropRight( selection, 1 ), id ]);
  }

  setSelection( uniq([ ...selection, id ]) );
}


// the route component
function Squad( props: Props ) {
  const { profile } = props;
  const [ squad, setSquad ] = React.useState([]);
  const [ selection, setSelection ] = React.useState([]);

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.PROFILE_SQUAD )
      .then( data => setSquad( data ) )
    ;
  }, [ profile ] );

  // bail if profile hasn't loaded
  if( !profile.data || !squad ) {
    return (
      <div id="squad" className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  // bail if no squad
  if( squad && squad.length === 0 ) {
    return (
      <div id="squad" className="loading-container">
        <Empty
          image={Empty.PRESENTED_IMAGE_DEFAULT}
          description="You don't have a squad!"
        />
      </div>
    );
  }

  return (
    <div id="squad" className="content">
      {/* TRAINING HEADER */}
      <Card
        className="training"
        title="Training Center"
        extra={<RemainingSessions num={1} />}
      >
        <section>
          <Typography.Text type="secondary">
            {`Double-click the player names below to select up to ${MAX_TRAINING} players per training session.`}
          </Typography.Text>
          <Typography.Text type="secondary">
            {'Double-click again to remove the player from the training session.'}
          </Typography.Text>
        </section>
        <Space direction="horizontal">
          {Array.from( Array( MAX_TRAINING ) ).map( ( _, idx ) => {
            const item = selection[ idx ];
            return (
              <Card
                key={idx}
                bordered={!!item}
                className={!item && 'empty'}
              >
                {item
                  ? squad.find( s => s.id === selection[ idx ]).alias
                  : <PlusOutlined />
                }
              </Card>
            );
          })}
        </Space>
        <Button
          block
          type="primary"
          disabled={selection.length === 0 || profile.loading}
          onClick={() => props.dispatch( ProfileActions.trainSquad( selection ) )}
        >
          {'Begin Training'}
        </Button>
      </Card>

      {/* PLAYER CARDS */}
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {squad.map( ( p: any ) =>
          <Col key={p.id} span={GRID_COL_WIDTH}>
            <PlayerCard
              player={p}
              me={profile.data.Player.id === p.id}
              selected={selection.includes( p.id )}
              onDoubleClick={( p: any ) => toggleSelection( selection, setSelection, p.id )}
              onSetStarter={( p: any ) => props.dispatch( ProfileActions.updateSquadMember({ id: p.id, starter: !p.starter }) )}
              onTransferList={( p: any ) => props.dispatch( ProfileActions.updateSquadMember({ id: p.id, transferListed: !p.transferListed }) )}
              onClickDetails={(p: any ) => ipcRenderer.send( IPCRouting.Offer.OPEN, p.id )}
            />
          </Col>
        )}
      </Row>
    </div>
  );
}


export default Connector.connect( Squad );
