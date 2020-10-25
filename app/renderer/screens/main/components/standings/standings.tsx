import React from 'react';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { Table, Typography } from 'antd';
import { StarFilled } from '@ant-design/icons';
import './standings.scss';


/**
 * Helper functions
 */


// @todo: store these in the shared folder
const PROMOTION_AUTO      = 2;
const PROMOTION_PLAYOFFS  = 6;
const RELEGATION          = 18;


function getRowClass( pos: number ) {
  const isauto = pos <= PROMOTION_AUTO;
  const isplayoffs = pos > PROMOTION_AUTO && pos <= PROMOTION_PLAYOFFS;
  const isrelegation = pos >= RELEGATION;

  if( isauto ) {
    return 'promotion-auto';
  }

  if( isplayoffs ) {
    return 'promotion-playoffs';
  }

  if( isrelegation ) {
    return 'relegation';
  }

  return '';
}


function NameColumn( props: { item: any; idx: number; highlightSeed: number }) {
  return (
    <>
      <span>{props.item.realpos || props.idx + 1}. {props.item.name}</span>
      {props.highlightSeed === props.item.seed && (
        <Typography.Text type="warning">
          <StarFilled />
        </Typography.Text>
      )}
    </>
  );
}


/**
 * Standings component
 */

interface StandingsProps {
  children?: any;
  dataSource: any[];
  disablePagination?: boolean;
  highlightSeed?: number;
  title?: string;
  pageSize?: number;
  size?: SizeType;
  sliceData?: number;
  rowKey?: string;
  onClick?: ( id: number ) => void;
}


export default function Standings( props: StandingsProps ) {
  // replace last item in standings with highlighted seed
  if( props.highlightSeed && props.sliceData ) {
    const idx = props.dataSource.findIndex( d => d.seed === props.highlightSeed );
    if( idx > -1 && idx >= props.sliceData ) {
      props.dataSource[ props.sliceData - 1 ] = { ...props.dataSource[ idx ], realpos: idx + 1 };
    }
  }

  return (
    <Table
      dataSource={props.sliceData && props.dataSource ? props.dataSource.slice( 0, props.sliceData ) : props.dataSource}
      pagination={!props.disablePagination && { pageSize: props.pageSize || 20, hideOnSinglePage: true }}
      rowClassName={( r, idx ) => getRowClass( idx + 1 )}
      rowKey={props.rowKey || 'id'}
      size={props.size || 'small'}
      onRow={r  => ({
        onClick: () => !!props.onClick && props.onClick( r.id )
      })}
    >
      <Table.ColumnGroup title={props.title}>
        <Table.Column
          ellipsis
          width="50%"
          title="Name"
          render={( item, r, idx ) => <NameColumn highlightSeed={props.highlightSeed} item={item} idx={idx} />}
        />
        <Table.Column
          title="W/L/D"
          width="30%"
          render={t => `${t?.wins || 0}/${t?.losses || 0}/${t?.draws || 0}`}
        />
        <Table.Column
          title="Pts."
          width="20%"
          render={t => t?.pts || 0}
        />
        {props.children}
      </Table.ColumnGroup>
    </Table>
  );
}
