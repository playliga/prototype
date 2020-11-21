import React from 'react';
import IpcService from 'renderer/lib/ipc-service';
import Connector from 'renderer/screens/main/components/connector';
import PlayerCard from 'renderer/screens/main/components/player-card';
import { RouteComponentProps } from 'react-router';
import { ipcRenderer } from 'electron';
import { ApplicationState } from 'renderer/screens/main/types';
import { Row, Col, Spin, Empty, Button } from 'antd';
import * as IPCRouting from 'shared/ipc-routing';
import * as ProfileActions from 'renderer/screens/main/redux/profile/actions';


interface Props extends RouteComponentProps, ApplicationState {
  dispatch: Function;
}


const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;


/**
 * Squad Route Component
 *
 * Enables user to interact with their squad.
 */

// the route component
function Squad( props: Props ) {
  const { profile } = props;
  const [ squad, setSquad ] = React.useState([]);

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
      <Button
        onClick={() => {
          props.dispatch( ProfileActions.trainSquad( squad.map( s => s.id ) ) );
        }}
      >
        {'Train'}
      </Button>
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {squad.map( ( p: any ) =>
          <Col key={p.id} span={GRID_COL_WIDTH}>
            <PlayerCard
              player={p}
              me={profile.data.Player.id === p.id}
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
