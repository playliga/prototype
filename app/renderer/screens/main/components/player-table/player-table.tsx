import React from 'react';
import { getEmojiFlag } from 'countries-list';
import { Table } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { green, red } from '@ant-design/colors';


export default function PlayerTable( props: any ) {
  return (
    <Table
      rowKey={props.rowKey || 'id'}
      size={props.size || 'middle'}
      loading={props.loading}
      dataSource={props.dataSource}
    >
      <Table.Column
        ellipsis
        title="Country"
        dataIndex="Country"
        align="center"
        width={100}
        filters={[
          { text: 'Europe', value: 4 },
          { text: 'North America', value: 5 },
        ]}
        render={( c: any ) => getEmojiFlag( c.code )}
        onFilter={( v: any, r: any ) => r.Country.ContinentId === v}
      />
      <Table.Column
        ellipsis
        title="Alias"
        dataIndex="alias"
      />
      <Table.Column
        ellipsis
        title="Team"
        dataIndex="Team"
        render={( t: any ) => t?.name || 'Free Agent'}
      />
      <Table.Column
        ellipsis
        title="Tier"
        dataIndex="tier"
        align="center"
        width={100}
        defaultSortOrder={'ascend'}
        sorter={( a: any, b: any ) => a.tier - b.tier}
      />
      <Table.Column
        title="Transfer Status"
        dataIndex="transferListed"
        align="center"
        width={150}
        filters={[
          { text: 'Transfer Listed', value: true },
          { text: 'Not Transfer Listed', value: false },
        ]}
        render={( t: any ) => t
          ? <CheckOutlined style={{ color: green.primary }} />
          : <CloseOutlined style={{ color: red.primary }} />
        }
        onFilter={( v: any, r: any ) => r.transferListed === v}
      />
      {props.children}
    </Table>
  );
}
