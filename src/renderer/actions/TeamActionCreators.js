var AppDispatcher = require('../dispatcher/AppDispatcher');
var TeamAPIUtils = require('../utils/TeamAPIUtils');

module.exports = {
  create: function(data){
    TeamAPIUtils.create(data); // should return some data or promise object...

    AppDispatcher.dispatch({
      type: 'CREATE_TEAM',
      data: {}
    });
  },

  receiveAll: function(data){
    AppDispatcher.dispatch({
      type: 'RECEIVE_TEAMS',
      data: data.rows
    });
  },

  removePlayers: function(teamObj, playerIdArr){
    playerIdArr.map(function(playerId){
      var pos = teamObj.squad.map(function(e){ return e.id }).indexOf(playerId);
      if(pos >= 0) teamObj.squad.splice(pos, 1);
    });

    TeamAPIUtils.update(teamObj); // should return some data or promise object...

    AppDispatcher.dispatch({
      type: 'REMOVE_PLAYERS',
      data: {}
    });
  }
};
