import React from 'react';
import { RouteComponentProps } from 'react-router';
import { ipcRenderer } from 'electron';
import { getEmojiFlag } from 'countries-list';
import {
  StarFilled,
  FolderOpenFilled,
  StarOutlined,
  CrownOutlined,
  ShoppingOutlined,
  ShoppingFilled
} from '@ant-design/icons';
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Statistic,
  Space,
  Tag,
  Divider,
  Tooltip
} from 'antd';

import * as IPCRouting from 'shared/ipc-routing';
import * as ProfileTypes from 'renderer/screens/main/redux/profile/types';
import * as ProfileSelectors from 'renderer/screens/main/redux/profile/selectors';
import * as ProfileActions from 'renderer/screens/main/redux/profile/actions';
import Connector from 'renderer/screens/main/components/connector';
import { getWeeklyWages } from 'renderer/lib/util';


interface Props extends RouteComponentProps {
  dispatch: Function;
  profile: ProfileTypes.ProfileState;
  squad: any[];
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

      {/* PLAYER COUNTRY + ALIAS */}
      <Typography.Title level={3}>
        {player.alias}
      </Typography.Title>

      <Divider orientation="center" className="flag-divider">
        <span className="flag-text">
          {getEmojiFlag( player.Country.code )} {player.Country.name}
        </span>
      </Divider>

      {/* PLAYER STATS */}
      <section className="stats">
        <Statistic
          title="Weekly Wages"
          prefix="$"
          value={getWeeklyWages( player.monthlyWages )}
        />
        <Statistic
          title="Transfer Value"
          prefix="$"
          value={player.transferValue}
        />
      </section>

      {/* TAGS CONTAINER */}
      <section className="tags">
        {me && (
          <Tag color="geekblue">
            <Space>
              <CrownOutlined />
              {'You'}
            </Space>
          </Tag>
        )}
        {player.starter && (
          <Tag color="orange">
            <Space>
              <StarFilled />
              {'Starter'}
            </Space>
          </Tag>
        )}
        {!me && player.transferListed && (
          <Tag color="red">
            <Space>
              <ShoppingFilled />
              {'Transfer Listed'}
            </Space>
          </Tag>
        )}
      </section>

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
  const { profile, squad } = props;

  // bail if profile hasn't loaded
  if( !profile.data || !squad ) {
    return (
      <div id="squad" className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div id="squad" className="content">
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


export default Connector.connect(
  Squad,
  { squad: ProfileSelectors.getSquad }
);
