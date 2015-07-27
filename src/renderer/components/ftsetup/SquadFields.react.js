// load the free agents team from the store.
// load the players from the free agents squad from the player store.
// that becomes our players state property.

var React = require('react');
var assign = require('object-assign');
var PlayerStore = require('../../stores/PlayerStore');
var TeamStore = require('../../stores/TeamStore');

function getStateFromStores(){
  return {
    players: PlayerStore.getAll(),
    teamObj: TeamStore.find('freeagents')
  }
}

var SquadFields = React.createClass({
  getInitialState: function(){
    return assign({
      squadList: [],
      playerList: [],
    }, getStateFromStores());
  },

  componentDidMount: function(){
    PlayerStore.addChangeListener(this._onChange);
    TeamStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function(){
    PlayerStore.removeChangeListener(this._onChange);
    TeamStore.removeChangeListener(this._onChange);
  },

  render: function(){
    var _self = this;
    return(
      <div>
        <form className="player-list">
          <h1>Select Squad</h1>
          <div className="form-group">
            <table className="table">
              <thead><tr>
                <th>Name</th><th>Skill Level</th><th>Preferred Weapon</th>
              </tr></thead>
              <tbody>
                {this.state.players.map(function(player){
                  return(
                    <tr key={player.doc._id} onClick={_self._onRowClick.bind(null, player)}>
                      <td>{player.doc.username}</td>
                      <td>{player.doc.skillTemplate}</td>
                      <td>{player.doc.weaponTemplate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button className="btn btn-primary" onClick={this._saveAndContinue}>Finish</button>
        </form>

        <div id="squad-list">
          {this.state.squadList.map(function(player){
            return(
              <div key={player.doc._id}>
                <p>{player.doc.username}</p>
                <p>{player.doc.skillTemplate}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  },

  _onChange: function(){
    this.setState(getStateFromStores());
  },

  _onRowClick: function(playerObj){
    var is_found = false;
    var squadList = this.state.squadList;

    // search the existing array is there are items in it.
    if(squadList.length > 0){
      for(var i = squadList.length - 1; i >= 0; i--){
        if(playerObj.doc.username == squadList[i].doc.username){
          squadList.splice(i, 1);
          is_found = true;
          break;
        }
      }
    }

    if(!is_found && squadList.length < 4) squadList.push(playerObj);
    this.setState({ squadList: squadList });
  },

  _saveAndContinue: function(e){
    e.preventDefault();

    this.props.saveValues({ squadList: this.state.squadList });
    this.props.submitFinal();
  }
});

module.exports = SquadFields;
