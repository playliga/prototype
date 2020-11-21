import React from 'react';
import ExpBar from 'renderer/screens/main/components/exp-bar';
import { StarFilled, FolderOpenFilled,StarOutlined, ShoppingOutlined,  ShoppingFilled } from '@ant-design/icons';
import { Card,Typography, Divider,  Tooltip, } from 'antd';
import { statModifiers } from 'shared/tiers';
import './player-card.scss';


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
    <Card hoverable actions={cardactions} id="player-card">

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


export default PlayerCard;
