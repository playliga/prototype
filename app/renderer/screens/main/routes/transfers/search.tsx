import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Table } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import IpcService from 'renderer/lib/ipc-service';
import { defaultTableColumns } from '../../common';


interface State {
  data: any[];
}


class Search extends React.Component<RouteComponentProps, State> {
  public state = {
    data: []
  }

  private columns: ColumnProps<any>[] = [
    ...defaultTableColumns
  ]

  public async componentDidMount() {
    const data = await IpcService.send( '/database/', {
      params: {
        model: 'Player',
        method: 'findAll',
        args: {
          include: [ 'Team', 'Country' ]
        }
      }
    });
    this.setState({ data });
  }

  public render() {
    return (
      <div className="content">
        <Table
          loading={this.state.data.length <= 0}
          rowKey="id"
          dataSource={this.state.data}
          columns={this.columns}
        />
      </div>
    );
  }
}


export default Search;
