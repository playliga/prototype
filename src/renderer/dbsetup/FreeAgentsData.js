/**
  * http://cs.playzone.lt/home/csgo/csgo/botprofile.db
  *
  * Elite:
  *   Skill = 100
  *   Aggression = 95
  *   ReactionTime = 0.05
  *   Difficulty = EXPERT
  *   AttackDelay = 0
  *
  * Hard:
  *   Skill = 75
  *   Aggression = 60
  *   ReactionTime = 0.40
  *   Difficulty = HARD
  *   AttackDelay = 0
  *
  * Easy:
  *   Skill = 5
  *   Aggression = 10
  *   ReactionTime = 0.60
  *   Difficulty = EASY
  *   AttackDelay = .70
  */
var PouchDB = require('pouchdb');
var dbTeams = PouchDB('la-liga-teams');
var dbPlayers = PouchDB('la-liga-players');

var teamObj = {
  _id: 'freeagents',
  name: 'Free Agents',
  squad: []
};

var playerArr = [];
var nameArr = [
  "Clay", "Forbes", "Trevino", "Whitfield", "Gray", "Battle", "Morales", "Tanner",
  "Edwards", "Mcfadden", "Pope", "Dotson", "Morse", "Payne", "Winters", "Erickson",
  "Garrison", "Walker", "Ferguson", "Kent", "Armstrong", "Gilmore", "Duncan", "Moore",
  "Lambert", "Ashley", "Hall", "Hansen", "Knox", "Keller", "Knight", "Sims", "Rodriquez",
  "Watson", "Nash", "Finch", "Page", "Puckett", "Fuentes", "Kane", "Conway", "Green",
  "Middleton", "Boyer", "Wall", "Figueroa", "Torres", "Austin", "Snow", "Cash", "Hancock",
  "Cobb", "Park", "Harper", "Davidson", "Floyd", "Walton", "Porter", "Mcdowell", "Kinney",
  "Rasmussen", "Zamora", "Irwin", "Glover", "Rodgers", "Malone", "Combs", "Dennis", "Riddle",
  "Roy", "Guy", "Mosley", "Love", "Stout", "Butler", "Bell", "Willis", "Orr", "Webb", "Berry",
  "Cochran", "Peterson", "Turner", "Montgomery", "Mcgowan", "Humphrey", "Castillo", "Waters",
  "White", "Olsen", "Boyd", "Bruce", "Deleon", "Salazar", "Hinton", "Washington", "Richard",
  "Mcmillan", "Norris", "Rodriguez"
];

function BasePlayer(username){
  this._id = camelize(username);
  this.username = username;
  this.teamId = 'freeagents';
  this.transferValue = 0;
  this.skillTemplate = 'Easy';
  this.weaponTemplate = 'Rifle';

  function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
  }
}

function loadPlayers(data){
  if(typeof(data) === 'undefined'){
    dbPlayers.allDocs({include_docs: true}).then(function(innerData){
      //CountriesActionCreators.receiveAll(innerData);
    });
  } else true //CountriesActionCreators.receiveAll(data);
}


for(var i = 0; i < nameArr.length; i++){
  var playerObj = new BasePlayer(nameArr[i]);
  
  if(i % 16 === 0){
    playerObj.weaponTemplate = 'Sniper';
  } else if(i % 32 === 0){
    playerObj.skillTemplate = 'Fair';
  } else if(i % 64 === 0){
    playerObj.skillTemplate = 'Normal';
  }

  playerArr.push(playerObj);
  teamObj.squad.push(playerObj._id);
}

module.exports = {
  init: function(){
    console.log(teamObj);
    console.log(playerArr);
  }
};
