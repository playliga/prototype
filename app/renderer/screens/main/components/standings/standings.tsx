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
  rowKey?: string;
}


export default function Standings( props: StandingsProps ) {
  return (
    <Table
      dataSource={props.dataSource}
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
          render={item => `${item.gpos || 1}. ${item.name}`}
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
