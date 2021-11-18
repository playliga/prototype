import React from 'react';
import { Table } from 'antd';
import { SizeType } from 'antd/lib/config-provider/SizeContext';


interface Props {
  children?: any;
  dataSource: any[];
  disablePagination?: boolean;
  title?: string;
  pageSize?: number;
  size?: SizeType;
  sliceData?: number;
  rowKey?: string;
  onClick?: ( id: number ) => void;
}


function NameColumn( props: { data: any }) {
  return (
    <>
      {props.data.logo && <img src={props.data.logo} width="16" height="16" />}
      {props.data.seed > -1 ? props.data.name : 'BYE'}
    </>
  );
}


export default function MatchResults( props: Props ) {
  const onClickHandler = ( id: number ) => (
    !!props.onClick && props.onClick( id )
  );

  return (
    <Table
      dataSource={props.sliceData && props.dataSource ? props.dataSource.slice( 0, props.sliceData ) : props.dataSource}
      pagination={!props.disablePagination && ({
        pageSize: props.pageSize || 20,
        hideOnSinglePage: true,
        showSizeChanger: false
      })}
      rowKey={props.rowKey || ( r => JSON.stringify( r.id ) )}
      size={props.size || 'small'}
    >
      <Table.ColumnGroup title={props.title}>
        <Table.Column
          ellipsis
          title="Home"
          width="35%"
          render={item => <NameColumn data={item.team1} />}
          onCell={( value: any ) => ({
            onClick: () => value.team1.seed > -1 && onClickHandler( value.team1.id )
          })}
        />
        <Table.Column
          ellipsis
          title="Away"
          width="35%"
          render={item => <NameColumn data={item.team2} />}
          onCell={( value: any ) => ({
            onClick: () => value.team2.seed > -1 && onClickHandler( value.team2.id )
          })}
        />
        <Table.Column
          title="Score"
          width="30%"
          align="center"
          render={value => value.m
            ? `${value.m[ 0 ]} - ${value.m[ 1 ]}`
            : '-'
          }
        />
      </Table.ColumnGroup>
    </Table>
  );
}
