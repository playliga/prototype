var AppDispatcher = require('../dispatcher/AppDispatcher');

module.exports = {
  receiveAll: function(data){
    AppDispatcher.dispatch({
      type: 'RECEIVE_TEAMS',
      data: data.rows
    });
  },
  removePlayers: function(teamObj, playerIdArr){
    AppDispatcher.dispatch({
      type: 'REMOVE_PLAYERS',
      data: {teamObj: teamObj, playerIdArr: playerIdArr}
    });
  }
};
