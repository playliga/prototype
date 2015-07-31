var UserActionCreators = require('../actions/UserActionCreators');
var PouchDB = require('pouchdb');
var db = PouchDB('la-liga-users');

module.exports = {
  create: function(userObj){
    return new Promise(function(resolve, reject){
      db.put(userObj).then(function(){
        return db.get(userObj._id);
      }).then(function(data){
        resolve(data);
      }).catch(function(){
        reject(Error('Database error'));
      });
    });
  }
};
