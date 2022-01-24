import React from 'react';
import ExpBar from 'renderer/screens/main/components/exp-bar';
import EmailDialogue from 'main/constants/emaildialogue';
import { StarFilled, FolderOpenFilled,StarOutlined, ShoppingOutlined,  ShoppingFilled } from '@ant-design/icons';
import { blue } from '@ant-design/colors';
import { Card, Typography, Divider,  Tooltip, Badge } from 'antd';
import { OfferStatus, StatModifiers } from 'shared/enums';
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
    props.onSetStarter && (
      <Tooltip title="Set as starter" key="starter">
        <StarterIcon starter={player.starter} onClick={() => props.onSetStarter( player )} />
      </Tooltip>
    ),
    props.onTransferList && (
      <Tooltip title="Transfer list" key="transfer">
        <TransferIcon transferListed={player.transferListed} onClick={() => props.onTransferList( player )} />
      </Tooltip>
    ),
    props.onClickDetails && (
      <Tooltip title={props.disableManagerActions ? 'Send offer' : 'View offers'} key="offers">
        {player.TransferOffers && player.TransferOffers.length > 0 && player.TransferOffers.some( ( item: any ) => item.status === OfferStatus.PENDING && item.msg === EmailDialogue.OFFER_SENT )
          ? <Badge dot><FolderOpenFilled onClick={() => props.onClickDetails( player )} /></Badge>
          : <FolderOpenFilled onClick={() => props.onClickDetails( player )} />
        }
      </Tooltip>
    ),
  ];

  // only need the details action if it's the user or not the user's squad
  if( me || props.disableManagerActions ) {
    cardactions = [ cardactions[ cardactions.length - 1 ] ];
  }

  // calculate total xp
  //
  // @note: to get a meaningful percentage of the stat progress
  //        total  - totalprev =       /   totalcurrent  - totalprev =
  //        126    - 120       = 6     /   151           - 120       = 6 / 31 = 19.35%
  let totalxp = 0;

  if( !me && player.xp ) {
    totalxp = (( player.xp.total - player.xp.totalprev ) / ( player.xp.totalcurrent - player.xp.totalprev ) ) * 100;
  }

  // calculate total xp gained from a previous training session?
  let totalgains = 0;

  if( player.gains && Object.keys( player.gains ).length > 0 ) {
    totalgains = Object
      .keys( player.gains )
      .map( key => player.gains[ key ] )
      .reduce( ( total, current ) => total + current )
    ;
  }

  return (
    <Card
      hoverable={!props.selected}
      actions={cardactions}
      id="player-card"
      onDoubleClick={() => props.onDoubleClick && props.onDoubleClick( player )}
      onClick={() => props.onClick && props.onClick( player )}
      style={props.selected ? { borderColor: blue.primary } : {}}
    >

      {/* PLAYER ALIAS */}
      <Typography.Title ellipsis level={3} className="alias">
        {player.alias}
      </Typography.Title>

      {/* TOTAL XP */}
      {player.xp && (
        <ExpBar
          title={`${Math.floor( player.xp.total )} XP`}
          prev={Math.floor( player.xp.totalprev )}
          next={Math.ceil( player.xp.totalcurrent )}
          success={totalxp - totalgains}
          total={totalxp}
        />
      )}

      {/* PLAYER COUNTRY */}
      <Divider orientation="center" className="flag-divider">
        <span className="flag-text">
          <span className={`fp ${player.Country.code.toLowerCase()}`} />
          {player.Country.name}
        </span>
      </Divider>

      {/* PLAYER STATS */}
      {props.player.stats && Object.keys( props.player.stats ).map( stat => {
        // inverse the formula if the stat is
        // improved by subtracting from it
        const total = StatModifiers.SUBTRACT.includes( stat )
          ? ( ( player.xp.prev?.stats[ stat ] - props.player.stats[ stat ] ) / ( player.xp.prev?.stats[ stat ] - player.xp.current.stats[ stat ] ) ) * 100
          : ( ( props.player.stats[ stat ] - player.xp.prev?.stats[ stat ] ) / ( player.xp.current.stats[ stat ] - player.xp.prev?.stats[ stat ] ) ) * 100
        ;
        return (
          <ExpBar
            key={stat}
            title={stat}
            prev={!!player.xp.prev && player.xp.prev.stats[ stat ]}
            success={player.gains && player.gains[ stat ] ? total - player.gains[ stat ] : 0}
            total={total}
            next={!!player.xp.current && player.xp.current.stats[ stat ]}
          />
        );
      })}
    </Card>
  );
}


export default PlayerCard;
