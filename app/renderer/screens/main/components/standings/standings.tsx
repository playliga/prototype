import React from 'react';
import { SizeType } from 'antd/lib/config-provider/SizeContext';
import { Table } from 'antd';


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
      rowClassName={r => props.highlightSeed && props.highlightSeed === r.seed && 'ant-table-row-selected'}
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
