import React from 'react';
import Tiers from 'shared/tiers.json';
import { isEqual } from 'lodash';
import { Badge, Button, Space, Table, Typography } from 'antd';
import { TablePaginationConfig } from 'antd/lib/table';
import { CheckOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { green, red } from '@ant-design/colors';
import { OfferStatus } from 'shared/enums';
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
  const original_filters = JSON.parse( localStorage.getItem( 'filters' ) ) || {};
  const original_pagination = JSON.parse( localStorage.getItem( 'pagination' ) ) || { position: [ 'topLeft' ]};
  const [ pagination, setPagination ] = React.useState<TablePaginationConfig>( original_pagination );
  const [ filters, setFilters ] = React.useState<Record<string, React.Key[]>>( original_filters );

  return (
    <div id="player-table">
      <Space>
        <Button
          onClick={() => setFilters({})}
          disabled={Object.keys( filters ).length === 0}
        >
          {'Clear Filters'}
        </Button>
        <Button
          type="primary"
          onClick={() => { localStorage.setItem( 'filters', JSON.stringify( filters ) ); localStorage.setItem( 'pagination', JSON.stringify( pagination ) ); }}
          disabled={isEqual( original_filters, filters ) && isEqual( original_pagination, pagination )}
        >
          {'Save Filters'}
        </Button>
      </Space>
      <Table
        rowKey={props.rowKey || 'id'}
        size={props.size || 'middle'}
        loading={props.loading}
        dataSource={props.dataSource}
        pagination={pagination}
        onChange={( p, f ) => { setFilters( f ); setPagination( p ); }}
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
          filteredValue={filters.alias || null}
          onFilter={( v: any, r: any ) => r.Country.ContinentId === v}
          render={( alias: any, r: any ) => {
            const haspendingoffer =  (r.TransferOffers as any[]).some( item => item.status === OfferStatus.PENDING && item.TeamId === props.teamId );
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
          filteredValue={filters.Team || null}
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
          filteredValue={filters.transferListed || null}
          render={( t: any ) => t
            ? <CheckOutlined style={{ color: green.primary }} />
            : <CloseOutlined style={{ color: red.primary }} />
          }
          onFilter={( v: any, r: any ) => r.transferListed === v}
        />
        {props.children}
      </Table>
    </div>
  );
}
