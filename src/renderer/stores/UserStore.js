var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var _data = undefined;

function BaseUser(username){
  this._id = camelize(username);
  this.username = username;
  this.team = null;
  this.country= null;
  this.budget = 0.00;

  function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index){
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
  }
}

var UserStore = assign({}, EventEmitter.prototype, {
  emitChange: function(){
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback){
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback){
    this.removeListener(CHANGE_EVENT, callback);
  },

  initUser: function(username){
    return new BaseUser(username);
  },

  getAll: function(){
    return _data;
  }
});

UserStore.dispatchToken = AppDispatcher.register(function(action){
  switch(action.type){
    case 'RECEIVE_USERS':
      _data = action.data;
      UserStore.emitChange();
      break;

    default:
      // do nothing
  }
});

module.exports = UserStore;
