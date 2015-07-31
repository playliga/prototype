var AppDispatcher = require('../dispatcher/AppDispatcher');
var TeamAPIUtils = require('../utils/TeamAPIUtils');

module.exports = {
  create: function(data){
    TeamAPIUtils.create(data).then(function(savedTeamObj){
      AppDispatcher.dispatch({
        type: 'CREATE_TEAM',
        data: savedTeamObj
      });
    });
  },

  receiveAll: function(data){
    AppDispatcher.dispatch({
      type: 'RECEIVE_TEAMS',
      data: data.rows
    });
  }
};
