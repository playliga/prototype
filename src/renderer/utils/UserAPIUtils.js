var UserActionCreators = require('../actions/UserActionCreators');
var PouchDB = require('pouchdb');
var db = PouchDB('la-liga-users');

module.exports = {
  create: function(userObj){
    db.put(userObj).then(function(){
      return db.allDocs({ include_docs: true });
    }).then(function(data){
      UserActionCreators.receiveAll(data);
    });;
  }
};
