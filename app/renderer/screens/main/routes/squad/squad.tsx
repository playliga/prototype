import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import Connector from 'renderer/screens/main/components/connector';
import PlayerCard from 'renderer/screens/main/components/player-card';
import { RouteComponentProps } from 'react-router';
import { ipcRenderer } from 'electron';
import { dropRight, uniq } from 'lodash';
import { Row, Col, Spin, Empty, Button, Card, Typography, Space } from 'antd';
import { PlusOutlined, UsergroupAddOutlined } from '@ant-design/icons';
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
  const [ trained, setTrained ] = React.useState( true );

  React.useEffect( () => {
    // fetch squad
    IpcService
      .send( IPCRouting.Database.PROFILE_SQUAD )
      .then( data => setSquad( data ) )
    ;

    // do we have any training sessions left?
    IpcService
      .send( IPCRouting.Database.PROFILE_SQUAD_TRAIN_ELIGIBLE )
      .then( data => {
        if( data ) {
          setSelection([]);
        }
        setTrained( data );
      })
    ;
  }, [ profile ] );

  // bail if squad hasn't loaded
  if( !squad ) {
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

  // did we have a previous training session?
  const prevsquad = squad
    .filter( s => s.gains && Object.keys( s.gains ).length > 0 )
    .map( s => s.id )
  ;

  return (
    <div id="squad" className="content">
      {/* TRAINING CENTER */}
      <Card
        className="training"
        title="Training Center"
        extra={<RemainingSessions num={+!trained} />}
      >
        {trained
          ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description=" Sorry, no more training sessions left for this week."
            />
          ) : (
            <section>
              <ul>
                <li>
                  <Typography.Text type="secondary">
                    {`Double-click the player names below to select up to ${MAX_TRAINING} players per training session.`}
                  </Typography.Text>
                </li>
                <li>
                  <Typography.Text type="secondary">
                    {'Double-click again to remove the player from the training session.'}
                  </Typography.Text>
                </li>
              </ul>
              <Space direction="horizontal">
                {Array.from( Array( MAX_TRAINING ) ).map( ( _, idx ) => {
                  const item = squad.find( s => s.id === selection[ idx ]);
                  return (
                    <Card
                      key={idx}
                      bordered={!!item}
                      className={!item && 'empty'}
                    >
                      {item
                        ? <><span className={`fp ${item.Country.code.toLowerCase()}`} /> {item.alias}</>
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
                {profile.loading
                  ? 'Training...'
                  : 'Begin Training'
                }
              </Button>
              <Button
                block
                type="link"
                disabled={selection.length > 0 || profile.loading || prevsquad.length === 0}
                onClick={() => setSelection( prevsquad )}
              >
                <UsergroupAddOutlined />
                {'Quick Add'}
              </Button>
            </section>
          )
        }
      </Card>

      {/* PLAYER CARDS */}
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {squad.map( ( p: any ) =>
          <Col key={p.id} span={GRID_COL_WIDTH}>
            <PlayerCard
              player={p}
              me={profile.data.Player.id === p.id}
              selected={selection.includes( p.id )}
              onDoubleClick={( p: any ) => !trained && toggleSelection( selection, setSelection, p.id )}
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
