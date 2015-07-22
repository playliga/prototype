var React = require('react');
var PlayerStore = require('../../stores/PlayerStore');

function getStateFromStores(){
  return {
    players: PlayerStore.getAll()
  }
}

var SquadFields = React.createClass({
  getInitialState: function(){
   return getStateFromStores(); 
  },

  componentDidMount: function(){
    PlayerStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function(){
    PlayerStore.removeChangeListener(this._onChange);
  },

  render: function(){
    var _self = this;
    return(
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
                  <tr key={player.doc._id} onClick={_self._onRowClick}>
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
    );
  },

  _onChange: function(){
    this.setState(getStateFromStores());
  },

  _onRowClick: function(e){
    console.log('clicked!');
    console.log(e.target);
  },

  _saveAndContinue: function(e){
    e.preventDefault();

    this.props.submitFinal();
  }
});

module.exports = SquadFields;
