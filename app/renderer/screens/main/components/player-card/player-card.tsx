import React from 'react';
import ExpBar from 'renderer/screens/main/components/exp-bar';
import { StarFilled, FolderOpenFilled,StarOutlined, ShoppingOutlined,  ShoppingFilled } from '@ant-design/icons';
import { blue } from '@ant-design/colors';
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
    <Card
      hoverable={!props.selected}
      actions={cardactions} id="player-card"
      onDoubleClick={() => props.onDoubleClick( player )}
      style={props.selected ? { borderColor: blue.primary } : {}}
    >

      {/* PLAYER ALIAS */}
      <Typography.Title ellipsis level={3} className="alias">
        {player.alias}
      </Typography.Title>

      {/* TOTAL XP */}
      <ExpBar
        title={`${Math.floor( player.xp.total )} XP`}
        prev={Math.floor( player.xp.totalprev )}
        next={Math.ceil( player.xp.totalcurrent )}
        total={(
          // to get a meaningful percentage of the stat progress
          // total  - totalprev =       /   totalcurrent  - totalprev =
          // 126    - 120       = 6     /   151           - 120       = 6 / 31 = 19.35%
          (( player.xp.total - player.xp.totalprev ) / ( player.xp.totalcurrent - player.xp.totalprev ) ) * 100
        )}
      />

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
            // inverse the formula if the stat is
            // improved by subtracting from it
            statModifiers.SUBTRACT.includes( stat )
              ? ( ( player.xp.prev?.stats[ stat ] - props.player.stats[ stat ] ) / ( player.xp.prev?.stats[ stat ] - player.xp.current.stats[ stat ] ) ) * 100
              : ( ( props.player.stats[ stat ] - player.xp.prev?.stats[ stat ] ) / ( player.xp.current.stats[ stat ] - player.xp.prev?.stats[ stat ] ) ) * 100
          )}
          next={!!player.xp.current && player.xp.current.stats[ stat ]}
        />
      ))}
    </Card>
  );
}


export default PlayerCard;
