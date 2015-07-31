var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var _data = undefined;

var PlayerStore = assign({}, EventEmitter.prototype, {
  emitChange: function(){
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback){
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback){
    this.removeListener(CHANGE_EVENT, callback);
  },

  getAll: function(){
    return _data;
  },

  findSquad: function(teamObj){
    return _data.filter(function(playerObj){
      if(teamObj.doc.squad.indexOf(playerObj.id) >= 0) return true;
      else return false;
    });
  }
});

PlayerStore.dispatchToken = AppDispatcher.register(function(action){
  switch(action.type){
    case 'RECEIVE_PLAYERS':
      _data = action.data;
      PlayerStore.emitChange();
      break;

    default:
      // do nothing
  }
});

module.exports = PlayerStore;
