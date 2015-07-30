var AppDispatcher = require('../dispatcher/AppDispatcher');
var UserAPIUtils = require('../utils/UserAPIUtils');

module.exports = {
  create: function(data){
    UserAPIUtils.create(data).then(function(savedUserObj){
      AppDispatcher.dispatch({
        type: 'CREATE_USER',
        data: savedUserObj
      });
    });
  },

  receiveAll: function(data){
    AppDispatcher.dispatch({
      type: 'RECEIVE_USERS',
      data: data.rows
    });
  }
};
