import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import IpcService from 'renderer/lib/ipc-service';
import PlayerTable from '../../components/player-table';


interface State {
  data: any[];
}


class Search extends React.Component<RouteComponentProps, State> {
  public state = {
    data: []
  }

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
        <PlayerTable
          loading={this.state.data.length <= 0}
          dataSource={this.state.data}
        />
      </div>
    );
  }
}


export default Search;
