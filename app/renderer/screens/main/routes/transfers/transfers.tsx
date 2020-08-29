import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as IPCRouting from 'shared/ipc-routing';
import IpcService from 'renderer/lib/ipc-service';
import PlayerTable from 'renderer/screens/main/components/player-table';


interface State {
  data: any[];
}


class Transfers extends React.Component<RouteComponentProps, State> {
  public state = {
    data: [] as any[]
  }

  public async componentDidMount() {
    const data = await IpcService.send( IPCRouting.Database.GENERIC, {
      params: {
        model: 'Player',
        method: 'findAll',
        args: {
          include: [{ all: true }]
        }
      }
    });
    this.setState({ data });
  }

  private handleRowClick = ( record: any ) => {
    ipcRenderer.send( IPCRouting.Offer.OPEN, record.id );
  }

  public render() {
    return (
      <div className="content">
        <PlayerTable
          loading={this.state.data.length <= 0}
          dataSource={this.state.data}
          onRowClick={this.handleRowClick}
        />
      </div>
    );
  }
}


export default Transfers;
