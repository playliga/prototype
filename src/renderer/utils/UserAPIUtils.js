var UserActionCreators = require('../actions/UserActionCreators');
var PouchDB = require('pouchdb');
var db = PouchDB('la-liga-users');

function BaseUser(username){
  var _id = camelize(username);
  var username = username;
  var teamId = null;
  var countryCode = 'US';
  var budget = 0.00;

  function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index){
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
  }
}

module.exports = {
  create: function(userObj){
    db.put(userObj).then(function(){
      return db.allDocs({ include_docs: true });
    }).then(function(data){
      UserActionCreators.receiveAll(data);
    });;
  }
};
