var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var TeamAPIUtils = require('../utils/TeamAPIUtils');

var CHANGE_EVENT = 'change';
var _data = undefined;

function _removePlayers(teamObj, playerIdArr){
  // loop through playerIdArr
  // look for that id within teamObj.squad array
  // if found, remove using splice.
  // save modified teamobj to database.
  playerIdArr.map(function(playerId){
    var pos = teamObj.squad.indexOf(playerId);
    if(pos >= 0) teamObj.squad.splice(pos, 1);
  });

  TeamAPIUtils.update(teamObj);
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
