var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var _data = undefined;

var CountryStore = assign({}, EventEmitter.prototype, {
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
  }
});

CountryStore.dispatchToken = AppDispatcher.register(function(action){
  switch(action.type){
    case 'RECEIVE_COUNTRIES':
      _data = action.data;
      CountryStore.emitChange();
      break;

    default:
      // do nothing
  }
});

module.exports = CountryStore;
