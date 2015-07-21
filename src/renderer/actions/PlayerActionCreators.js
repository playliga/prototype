var AppDispatcher = require('../dispatcher/AppDispatcher');

module.exports = {
  receiveAll: function(data){
    AppDispatcher.dispatch({
      type: 'RECEIVE_PLAYERS',
      data: data.rows
    });
  }
};
