var AppDispatcher = require('../dispatcher/AppDispatcher');

module.exports = {
  receiveAll: function(data){
    AppDispatcher.dispatch({
      type: 'RECEIVE_COUNTRIES',
      data: data.rows
    });
  }
};
