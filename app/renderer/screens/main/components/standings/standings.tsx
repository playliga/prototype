import React from 'react';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { Table } from 'antd';
import './standings.scss';


/**
 * Helper functions
 */


// @todo: store these in the shared folder
const PROMOTION_AUTO      = 2;
const PROMOTION_PLAYOFFS  = 6;
const RELEGATION          = 18;


function getRowClass( rowdata: any, pos: number, seed?: number ) {
  return (
    // highlight user seed with their own color,
    // unless they are in the relegation zone
    seed === rowdata.seed
      ? pos < RELEGATION
        ? 'ant-table-row-selected'
        : 'relegation'

      // highlight promotion
      : pos <= PROMOTION_AUTO
        ? 'promotion-auto'
        : pos > PROMOTION_AUTO && pos <= PROMOTION_PLAYOFFS
          ? 'promotion-playoffs'

          // highlight relegation
          : pos >= RELEGATION
            ? 'relegation'
            : ''
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
      rowClassName={( r, idx ) => getRowClass( r, idx + 1, props.highlightSeed )}
      rowKey={props.rowKey || 'id'}
      size={props.size || 'small'}
    >
      <Table.ColumnGroup title={props.title}>
        <Table.Column
          ellipsis
          width="50%"
          title="Name"
          render={( item, r, idx ) => `${item.realpos || idx + 1}. ${item.name}`}
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
