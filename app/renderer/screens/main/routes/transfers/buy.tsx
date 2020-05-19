import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Table, Button } from 'antd';
import { AuditOutlined } from '@ant-design/icons';
import IpcService from 'renderer/lib/ipc-service';
import PlayerTable from '../../components/player-table';


interface State {
  data: any[];
}


class Buy extends React.Component<RouteComponentProps, State> {
  public state = {
    data: []
  }

  public async componentDidMount() {
    const data = await IpcService.send( '/database/', {
      params: {
        model: 'Player',
        method: 'findAll',
        args: {
          where: { transferListed: true },
          include: [ 'Team', 'Country' ]
        }
      }
    });
    this.setState({ data });
  }

  public render() {
    return (
      <div className="content">
        <PlayerTable
          loading={this.state.data.length <= 0}
          dataSource={this.state.data}
        >
          <Table.Column
            ellipsis
            title="Actions"
            key="actions"
            width={200}
            render={() => (
              <Button
                type="link"
                icon={<AuditOutlined />}
              />
            )}
          />
        </PlayerTable>
      </div>
    );
  }
}


export default Buy;
