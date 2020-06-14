import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import * as IPCRouting from 'shared/ipc-routing';
import IpcService from 'renderer/lib/ipc-service';
import PlayerTable from 'renderer/screens/main/components/player-table';


interface State {
  data: any[];
}


class Search extends React.Component<RouteComponentProps, State> {
  public state = {
    data: []
  }

  public async componentDidMount() {
    const data = await IpcService.send( IPCRouting.Database.GENERIC, {
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

  private handleRowClick = ( record: any ) => {
    ipcRenderer.send( IPCRouting.Offer.OPEN, record );
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


export default Search;
