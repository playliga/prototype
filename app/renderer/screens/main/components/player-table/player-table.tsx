import React from 'react';
import { Badge, Table, Typography } from 'antd';
import { CheckOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { green, red } from '@ant-design/colors';
import Tiers from 'shared/tiers';
import { formatCurrency, getWeeklyWages } from 'renderer/lib/util';
import './player-table.scss';


function TeamColumn( props: any ) {
  if( !props.name ) {
    return <span>Free Agent</span>;
  }

  return (
    <div>
      <Typography.Text style={{ display: 'block' }}>
        {props.name}
      </Typography.Text>
      <Typography.Text type="secondary">
        {Tiers[ props.tier ].name}
      </Typography.Text>
    </div>
  );
}


export default function PlayerTable( props: any ) {
  return (
    <Table
      className="player-table"
      rowKey={props.rowKey || 'id'}
      size={props.size || 'middle'}
      loading={props.loading}
      dataSource={props.dataSource}
      pagination={{ position: [ 'topLeft' ] }}
      onRow={( record, idx ) => ({
        idx,
        onClick: () => props.onRowClick( record ),
      })}
    >
      <Table.Column
        ellipsis
        title="Alias"
        dataIndex="alias"
        filters={[
          { text: 'Europe', value: 4 },
          { text: 'North America', value: 5 },
        ]}
        onFilter={( v: any, r: any ) => r.Country.ContinentId === v}
        render={( alias: any, r: any ) => {
          const haspendingoffer =  (r.TransferOffers as any[]).some( item => item.status === 'pending' && item.TeamId === props.teamId );

          if( haspendingoffer ) {
            return (
              <Badge count={<ClockCircleOutlined style={{ paddingLeft: 20, color: red.primary }}/>}>
                <span className={`fp ${r.Country.code.toLowerCase()}`} /> {alias}
              </Badge>
            );
          }

          return (
            <><span className={`fp ${r.Country.code.toLowerCase()}`} /> {alias}</>
          );
        }}
      />
      <Table.Column
        ellipsis
        title="Team"
        dataIndex="Team"
        filters={[
          ...Tiers.map( ( tier, idx ) => ({
            text: `${tier.name}`,
            value: idx,
          })),
          {
            text: 'Free Agent',
            value: false
          },
        ]}
        onFilter={( v: any, r: any ) => Number.isInteger( v ) ? r.tier === v : r.Team === null }
        render={t => <TeamColumn {...t} />}
      />
      <Table.Column
        ellipsis
        title="Wage"
        dataIndex="monthlyWages"
        align="center"
        width={100}
        defaultSortOrder={'descend'}
        render={w => `${formatCurrency( getWeeklyWages( w ) )}/wk`}
        sorter={( a: any, b: any ) => a.monthlyWages - b.monthlyWages}
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
