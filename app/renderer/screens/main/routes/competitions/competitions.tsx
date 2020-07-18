import React from 'react';
import { Spin, Row, Col, Typography, Table } from 'antd';
import * as IPCRouting from 'shared/ipc-routing';
import IpcService from 'renderer/lib/ipc-service';


interface Props {
  dispatch: Function;
}


const GUTTER_H = 8;
const GUTTER_V = 8;
const GRID_COL_WIDTH = 8;


/**
 * Standings Component
 */

function Standings( props: any ) {
  return (
    <Table
      size={props.size || 'small'}
      dataSource={props.dataSource}
      pagination={!props.disablePagination && { pageSize: props.pageSize || 20, hideOnSinglePage: true }}
    >
      <Table.ColumnGroup title={props.name}>
        <Table.Column
          title="Pos."
          width="20%"
          render={( t, r, idx ) => idx + 1}
        />
        <Table.Column
          ellipsis
          title="Name"
          width="80%"
          dataIndex="name"
        />
        {props.children}
      </Table.ColumnGroup>
    </Table>
  );
}


/**
 * Main Route Component
 */

function Competitions() {
  const [ comps, setComps ] = React.useState([]);

  React.useEffect( () => {
    IpcService
      .send( IPCRouting.Database.COMPETITION_ALL )
      .then( c => setComps( c ) )
    ;
  }, []);

  if( !comps || comps.length <= 0 ) {
    return (
      <div id="competitions" className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div id="competitions" className="content">
      <Row gutter={[ GUTTER_H, GUTTER_V ]}>
        {comps.map( c => (
          <Col key={c.id} span={GRID_COL_WIDTH}>
            <Typography.Title level={3}>
              {c.data.name}: {c.Continents[0].name}
            </Typography.Title>
            <Standings
              name={c.data.divisions[0].name}
              disablePagination
              dataSource={c.data.divisions[0].competitors.slice( 0, 10 )}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}


export default Competitions;
