var TeamActionCreators = require('../actions/TeamActionCreators');
var PouchDB = require('pouchdb');
var db = PouchDB('la-liga-teams');

module.exports = {
  create: function(teamObj){
    return new Promise(function(resolve, reject){
      db.put(teamObj).then(function(){
        return db.get(teamObj._id);
      }).then(function(data){
        resolve(data);
      }).catch(function(){
        reject(Error('Database error'));
      });
    });
  },

  update: function(teamObj){
    return new Promise(function(resolve, reject){
      db.put(teamObj).then(function(){
        return db.allDocs({ include_docs: true });
      }).then(function(data){
        resolve(data);
      }).catch(function(){
        reject();
      });
    });
  }
};
