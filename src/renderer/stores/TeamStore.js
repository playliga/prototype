var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var TeamAPIUtils = require('../utils/TeamAPIUtils');

var CHANGE_EVENT = 'change';
var _data = undefined;

function BaseTeam(teamname){
  this._id = camelize(teamname);
  this.name = teamname;
  this.country = null;
  this.manager = null;
  this.squad = null;
  this.budget = 0.00;

  function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index){
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
  }
}

function _removePlayers(teamObj, playerIdArr){
  playerIdArr.map(function(playerId){
    var pos = teamObj.squad.map(function(e){ return e.id }).indexOf(playerId);
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

  initTeam: function(teamname){
    return new BaseTeam(teamname);
  },

  getAll: function(){
    return _data;
  },

  find: function(id){
    return _data.filter(function(obj){
      return id === obj.id;
    })[0];
  }
});

TeamStore.dispatchToken = AppDispatcher.register(function(action){
  switch(action.type){
    case 'CREATE_TEAM':
      TeamAPIUtils.create(action.data);
      TeamStore.emitChange();
      break;

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
