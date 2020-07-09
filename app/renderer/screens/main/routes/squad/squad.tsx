import React from 'react';
import { RouteComponentProps } from 'react-router';
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
  Divider
} from 'antd';

import * as ProfileTypes from 'renderer/screens/main/redux/profile/types';
import * as SquadTypes from 'renderer/screens/main/redux/squad/types';
import * as SquadActions from 'renderer/screens/main/redux/squad/actions';
import { getWeeklyWages } from 'renderer/lib/util';
import Connector from 'renderer/screens/main/components/connector';


interface Props extends RouteComponentProps {
  dispatch: Function;
  profile: ProfileTypes.ProfileState;
  squad: SquadTypes.SquadState;
}


const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;


/**
 * Renders an individual player card.
 */

function StarterIcon({ starter, onClick }: any ) {
  if( starter ) {
    return (
      <Typography.Text type="warning">
        <StarFilled onClick={onClick} type="warning" />
      </Typography.Text>
    );
  }

  return (
    <StarOutlined onClick={onClick} />
  );
}


function TransferIcon({ transferListed, onClick }: any ) {
  if( transferListed ) {
    return (
      <Typography.Text type="danger">
        <ShoppingFilled onClick={onClick} type="danger" />
      </Typography.Text>
    );
  }

  return (
    <ShoppingOutlined onClick={onClick} />
  );
}


function PlayerCard( props: any ) {
  const { player, me } = props;

  let cardactions = [
    <StarterIcon key="starter" starter={player.starter} onClick={() => props.onSetStarter( player )} />,
    <TransferIcon key="transfer" transferListed={player.transferListed} onClick={() => props.onTransferList( player )} />,
    <FolderOpenFilled key="details" onClick={() => props.onClickDetails( player )} />,
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
  if( !profile.data || !squad.data ) {
    return (
      <div id="squad" className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  // on component load; fetch the squad
  React.useEffect( () => {
    props.dispatch( SquadActions.find( profile.data.Team.id ) );
  }, []);

  return (
    <div id="squad" className="content">
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {squad.data.map( ( p: any ) =>
          <Col key={p.id} span={GRID_COL_WIDTH}>
            <PlayerCard
              player={p}
              me={profile.data.Player.id === p.id}
              onSetStarter={( p: any ) => props.dispatch( SquadActions.update({ id: p.id, starter: !p.starter }) )}
              onTransferList={( p: any ) => props.dispatch( SquadActions.update({ id: p.id, transferListed: !p.transferListed }) )}
              onClickDetails={() => props.history.push( `/squad/${p.id}` )}
            />
          </Col>
        )}
      </Row>
    </div>
  );
}


export default Connector.connect( Squad );
