import React from 'react';
import { RouteComponentProps } from 'react-router';
import { ipcRenderer } from 'electron';
import { ApplicationState } from 'renderer/screens/main/types';
import {
  StarFilled,
  FolderOpenFilled,
  StarOutlined,
  ShoppingOutlined,
  ShoppingFilled
} from '@ant-design/icons';
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Divider,
  Tooltip,
  Empty,
  Button
} from 'antd';

import * as IPCRouting from 'shared/ipc-routing';
import { statModifiers } from 'shared/tiers';
import * as ProfileActions from 'renderer/screens/main/redux/profile/actions';
import IpcService from 'renderer/lib/ipc-service';
import Connector from 'renderer/screens/main/components/connector';
import ExpBar from 'renderer/screens/main/components/exp-bar';


interface Props extends RouteComponentProps, ApplicationState {
  dispatch: Function;
}


const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;


/**
 * Renders an individual player card.
 */

function StarterIcon({ starter, onClick, ...tooltipProps }: any ) {
  if( starter ) {
    return (
      <Typography.Text type="warning" {...tooltipProps}>
        <StarFilled onClick={onClick} type="warning" />
      </Typography.Text>
    );
  }

  return (
    <StarOutlined onClick={onClick} {...tooltipProps} />
  );
}


function TransferIcon({ transferListed, onClick, ...tooltipProps }: any ) {
  if( transferListed ) {
    return (
      <Typography.Text type="danger" {...tooltipProps}>
        <ShoppingFilled onClick={onClick} type="danger" />
      </Typography.Text>
    );
  }

  return (
    <ShoppingOutlined onClick={onClick} {...tooltipProps} />
  );
}


function PlayerCard( props: any ) {
  const { player, me } = props;

  let cardactions = [
    <Tooltip title="Set as starter" key="starter">
      <StarterIcon starter={player.starter} onClick={() => props.onSetStarter( player )} />
    </Tooltip>,
    <Tooltip title="Transfer list" key="transfer">
      <TransferIcon transferListed={player.transferListed} onClick={() => props.onTransferList( player )} />
    </Tooltip>,
    <Tooltip title="View offers" key="offers">
      <FolderOpenFilled onClick={() => props.onClickDetails( player )} />
    </Tooltip>,
  ];

  // only need the details action if it's the user
  if( me ) {
    cardactions = [ cardactions[ cardactions.length - 1 ] ];
  }

  return (
    <Card hoverable actions={cardactions}>

      {/* PLAYER ALIAS */}
      <Typography.Title ellipsis level={3} className="alias">
        {player.alias}
      </Typography.Title>

      {/* PLAYER COUNTRY */}
      <Divider orientation="center" className="flag-divider">
        <span className="flag-text">
          <span className={`fp ${player.Country.code.toLowerCase()}`} />
          {player.Country.name}
        </span>
      </Divider>

      {/* PLAYER STATS */}
      {Object.keys( props.player.stats ).map( stat => (
        <ExpBar
          key={stat}
          title={stat}
          prev={!!player.xp.prev && player.xp.prev.stats[ stat ]}
          total={(
            statModifiers.SUBTRACT.includes( stat )
              ? ( player.xp.current.stats[ stat ] / props.player.stats[ stat ] ) * 100
              : ( props.player.stats[ stat ] / player.xp.current.stats[ stat ] ) * 100
          )}
          next={!!player.xp.current && player.xp.current.stats[ stat ]}
        />
      ))}
    </Card>
  );
}


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
