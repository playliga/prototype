var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';
var _data = undefined;

function _removePlayers(teamObj, playerIdArr){
  // loop through playerIdArr
  // look for that id within teamObj.squad array
  // if found, remove using splice.
  // save modified teamobj to database.
  var ax = null;
  playerIdArr.map(function(playerId){
    if(ax == teamObj.squad.indexOf(playerId) !== -1){
      teamObj.squad.splice(ax, 1);
    }
  });
}

var TeamStore = assign({}, EventEmitter.prototype, {
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

TeamStore.dispatchToken = AppDispatcher.register(function(action){
  switch(action.type){
    case 'RECEIVE_TEAMS':
      _data = action.data;
      TeamStore.emitChange();
      break;

    case 'REMOVE_PLAYERS':
      _removePlayers(action.data.teamObj, action.data.playerIdArr);
      TeamStore.emitChange();
      break;

    default:
      // do nothing
  }
});

module.exports = TeamStore;
