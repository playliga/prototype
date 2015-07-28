var TeamActionCreators = require('../actions/TeamActionCreators');
var PouchDB = require('pouchdb');
var db = PouchDB('la-liga-teams');

module.exports = {
  create: function(teamObj){
    db.put(teamObj).then(function(){
      return db.allDocs({ include_docs: true });
    }).then(function(data){
      TeamActionCreators.receiveAll(data);
    });
  },
  update: function(teamObj){
    db.put(teamObj).then(function(){
      return db.allDocs({include_docs: true});
    }).then(function(data){
      TeamActionCreators.receiveAll(data);
    });
  }
};
