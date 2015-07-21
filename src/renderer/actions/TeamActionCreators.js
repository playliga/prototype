var AppDispatcher = require('../dispatcher/AppDispatcher');

module.exports = {
  receiveAll: function(data){
    AppDispatcher.dispatch({
      type: 'RECEIVE_TEAMS',
      data: data.rows
    });
  }
};
